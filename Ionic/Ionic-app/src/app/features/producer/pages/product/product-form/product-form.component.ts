import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl,
  ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  IonicModule, AlertController, ToastController
} from '@ionic/angular';

import {
  ProductImageSelectModel,
  ProductUpdateModel,
  ProductRegisterModel,
} from 'src/app/shared/models/product/product.model';
import { ProductService } from 'src/app/shared/services/product/product.service';
import { ProductImageService } from 'src/app/shared/services/productImage/product-image.service';
import { FarmService } from 'src/app/shared/services/farm/farm.service';
import { CategoryService } from 'src/app/features/parameters/services/category/category.service';

import { catchError, finalize, of, take } from 'rxjs';



// === Validadores utilitarios ===
const notWhiteSpaceValidator = (label: string): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null =>
    (typeof c.value === 'string' && c.value.trim().length === 0)
      ? { whitespace: `${label} no puede estar en blanco.` } : null;

const positiveNumberValidator = (label: string): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null => {
    const n = Number(c.value);
    if (!Number.isFinite(n) || n <= 0) return { positive: `${label} debe ser mayor a 0.` };
    return null;
  };

const positiveIntValidator = (label: string): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null => {
    const n = Number(c.value);
    if (!Number.isInteger(n) || n <= 0) return { positiveInt: `Debe seleccionar ${label.toLowerCase()} válida.` };
    return null;
  };

const arrayMinLen = (min: number): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null => {
    const v = c.value as unknown;
    return Array.isArray(v) && v.length >= min ? null : { arrayMinLen: true };
  };

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  private productSrv = inject(ProductService);
  private imageSrv = inject(ProductImageService);
  private farmService = inject(FarmService);
  private categoryService = inject(CategoryService);

  farms: any[] = [];
  categories: any[] = [];
  readonly unitOptions = [
    'Arroba',
    'Bolsa',
    'Bulto',
    'Caja',
    'Docena',
    'Gramo (g)',
    'Kilogramo (kg)',
    'Libra (lb)',
    'Litro (L)',
    'Mililitro (ml)',
    'Paquete',
    'Tonelada (t)',
    'Unidad (u)',
  ];

  generalGroup = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      notWhiteSpaceValidator('Nombre'),
    ]),
    description: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(500),
      notWhiteSpaceValidator('Descripcion'),
    ]),
    price: this.fb.control<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(0),
        Validators.max(100_000_000),
        Validators.pattern(/^\d+$/),
      ],
    }),
    unit: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(20),
      notWhiteSpaceValidator('Unidad'),
    ]),
    production: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(150),
      notWhiteSpaceValidator('Produccion'),
    ]),
  });

  detallesGroup = this.fb.group({
    stock: this.fb.control(0, {
      validators: [
        Validators.required,
        Validators.pattern(/^[0-9]+$/),
        Validators.max(100_000),
      ],
      nonNullable: true,
    }),
    status: this.fb.nonNullable.control(true, [Validators.required]),
    categoryId: this.fb.control<number | null>(null, [
      Validators.required,
      positiveIntValidator('Categoria'),
    ]),
    farmIds: this.fb.nonNullable.control<(number | string)[]>([], {
      validators: [arrayMinLen(1)],
    }),
    shippingIncluded: this.fb.nonNullable.control(false),
  });

  isLoading = false;
  isDeletingImage = false;

  readonly MAX_IMAGES = 5;
  readonly MAX_FILE_SIZE_MB = 5;
  readonly MAX_FILE_SIZE_BYTES = this.MAX_FILE_SIZE_MB * 1024 * 1024;

  selectedFiles: File[] = [];
  imagesPreview: string[] = [];
  existingImages: ProductImageSelectModel[] = [];
  imagesToDelete: string[] = [];

  productId?: number;
  isEdit = false;
  private pendingFarmIds: (number | string)[] | null = null;
  private pendingFarmNames: string[] | null = null;

  compareWithIds = (option: any, selected: any): boolean => {
    const a = this.normalizeId(option);
    const b = this.normalizeId(selected);
    if (a === null || b === null) return false;
    return String(a) === String(b);
  };

  stepControl = new FormControl<'general' | 'detalles' | 'imagenes'>('general', { nonNullable: true });

  // Helpers
  get totalImages(): number { return this.selectedFiles.length + this.existingImages.length; }
  get canAddMore(): boolean { return this.totalImages < this.MAX_IMAGES; }

  ngOnInit(): void {
    this.loadCategories();
    this.loadFarm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEdit = true;
        this.productId = Number(idParam);
        this.loadProduct(this.productId);
      } else {
        this.isEdit = false;
        this.productId = undefined;
        this.resetFormForCreate();
      }
    });
  }

  private resetFormForCreate(): void {
    this.generalGroup.reset({
      name: '',
      description: '',
      price: null,
      unit: '',
      production: '',
    });

    this.detallesGroup.reset({
      stock: 0,
      status: true,
      categoryId: null,
      farmIds: [],
      shippingIncluded: false,
    });

    this.selectedFiles = [];
    this.imagesPreview = [];
    this.existingImages = [];
    this.imagesToDelete = [];
    this.pendingFarmIds = null;
    this.pendingFarmNames = null;
    this.stepControl.setValue('general', { emitEvent: false });
    this.generalGroup.markAsPristine();
    this.detallesGroup.markAsPristine();
    this.generalGroup.markAsUntouched();
    this.detallesGroup.markAsUntouched();
  }

  private loadProduct(id: number) {
    this.isLoading = true;
    this.productSrv.getById(id).subscribe({
      next: (p) => {
        this.generalGroup.patchValue({
          name: p.name,
          description: p.description,
          price: p.price,
          unit: p.unit,
          production: p.production,
        });

        this.detallesGroup.patchValue({
          stock: p.stock,
          status: p.status,
          categoryId: p.categoryId,
          shippingIncluded: (p as any).shippingIncluded ?? false,
        });
        this.syncFarmSelection(this.extractFarmIds(p), this.extractFarmNames(p));

        this.generalGroup.markAsPristine();
        this.detallesGroup.markAsPristine();
        this.generalGroup.markAsUntouched();
        this.detallesGroup.markAsUntouched();
        this.generalGroup.updateValueAndValidity({ emitEvent: false });
        this.detallesGroup.updateValueAndValidity({ emitEvent: false });
        this.imageSrv.getImagesByProductId(p.id).subscribe(imgs => this.existingImages = imgs ?? []);
      },
      complete: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }
  loadFarm() {
    this.farmService.getByProducer().subscribe({
      next: (d: any) => { // Forzamos tipado generico
        console.log('Respuesta fincas:', d);

        // Detecta si viene dentro de un objeto con propiedad data
        const raw = Array.isArray(d)
          ? d
          : Array.isArray(d?.data)
            ? d.data
            : [];

        this.farms = this.normalizeFarmList(raw);
        this.tryApplyPendingFarmSelection();

        console.log('Fincas procesadas:', this.farms);
      },
      error: (e) => console.error('Error al obtener fincas', e)
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe((d) => this.categories = d ?? []);
  }

  private applyFarmIds(ids: (number | string)[]): void {
    const value = Array.isArray(ids) ? [...ids] : [];
    this.detallesGroup.controls.farmIds.setValue(value, { emitEvent: false });
    this.detallesGroup.controls.farmIds.markAsPristine();
    this.detallesGroup.controls.farmIds.markAsUntouched();
    this.detallesGroup.controls.farmIds.updateValueAndValidity({ emitEvent: false });
  }

  private syncFarmSelection(farmIds: (number | string)[], farmNames: string[]): void {
    if (this.hasFarmsLoaded()) {
      if (farmIds.length) {
        this.applyFarmIds(farmIds);
      } else if (farmNames.length) {
        const resolved = this.resolveFarmIdsFromNames(farmNames);
        this.applyFarmIds(resolved);
      } else {
        this.applyFarmIds([]);
      }
      this.pendingFarmIds = null;
      this.pendingFarmNames = null;
      return;
    }

    this.pendingFarmIds = farmIds.length ? [...farmIds] : null;
    this.pendingFarmNames = !farmIds.length && farmNames.length ? [...farmNames] : null;
  }

  private hasFarmsLoaded(): boolean {
    return Array.isArray(this.farms) && this.farms.length > 0;
  }

  private tryApplyPendingFarmSelection(): void {
    if (!this.hasFarmsLoaded()) return;

    if (this.pendingFarmIds?.length) {
      this.applyFarmIds(this.pendingFarmIds);
      this.pendingFarmIds = null;
      this.pendingFarmNames = null;
      return;
    }

    if (this.pendingFarmNames?.length) {
      const resolved = this.resolveFarmIdsFromNames(this.pendingFarmNames);
      this.applyFarmIds(resolved);
      this.pendingFarmIds = null;
      this.pendingFarmNames = null;
    }
  }

  private normalizeFarmList(items: any[]): any[] {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        const normalizedId = this.normalizeId(item);
        const id = this.coerceId(normalizedId);
        const name = this.extractFarmDisplayName(item);
        return {
          ...item,
          id: id ?? item?.id ?? item?.farmId ?? item?.farmID ?? item?.FarmId,
          name: name ?? item?.name ?? item?.farmName ?? item?.FarmName ?? item?.nombre,
        };
      })
      .filter((item) =>
        item.id !== null &&
        item.id !== undefined &&
        typeof item.name === 'string' &&
        item.name.trim().length
      );
  }

  private extractFarmNames(product: any): string[] {
    const names = new Set<string>();
    const push = (value: unknown) => {
      if (typeof value === 'string') {
        const normalized = value.trim();
        if (normalized.length) names.add(normalized);
      }
    };

    push(product?.farmName);
    push((product as any)?.FarmName);

    const farmNames = (product as any)?.farmNames ?? (product as any)?.FarmNames;
    if (Array.isArray(farmNames)) {
      farmNames.forEach(push);
    } else if (typeof farmNames === 'string') {
      farmNames.split(',').forEach(push);
    }

    const farmsCollection = (product as any)?.farms ?? (product as any)?.Farms;
    if (Array.isArray(farmsCollection)) {
      farmsCollection.forEach((f: any) => {
        push(f?.name);
        push(f?.farmName);
        push(f?.nombre);
      });
    }

    return Array.from(names);
  }

  private extractFarmDisplayName(value: any): string | null {
    if (!value || typeof value !== 'object') return null;
    const candidates = ['name', 'farmName', 'FarmName', 'nombre', 'Nombre'];
    for (const key of candidates) {
      const val = (value as any)[key];
      if (typeof val === 'string' && val.trim().length) {
        return val.trim();
      }
    }
    return null;
  }

  private resolveFarmIdsFromNames(names: string[]): (number | string)[] {
    if (!this.hasFarmsLoaded() || !Array.isArray(names) || !names.length) return [];
    const target = names
      .map((name) => (typeof name === 'string' ? name.trim().toLowerCase() : ''))
      .filter(Boolean);
    if (!target.length) return [];

    const matched = this.farms
      .filter((farm) => {
        const farmName = typeof farm?.name === 'string' ? farm.name.trim().toLowerCase() : '';
        return farmName && target.includes(farmName);
      })
      .map((farm) => farm.id)
      .filter((id) => id !== null && id !== undefined);
    return Array.from(new Set(matched));
  }

  private coerceId(value: number | string | null): number | string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed;
  }

  private extractFarmIds(product: any): (number | string)[] {
    if (!product) return [];

    let raw: any[] = [];
    const responseFarmIds =
      product.farmIds ??
      product.FarmIds ??
      (product as any)?.farmIDs ??
      (product as any)?.FarmIDs ??
      (product as any)?.farm_ids ??
      null;

    if (Array.isArray(responseFarmIds) && responseFarmIds.length) {
      raw = responseFarmIds;
    } else if (typeof responseFarmIds === 'string' && responseFarmIds.trim().length) {
      const trimmed = responseFarmIds.trim();
      try {
        const parsed = JSON.parse(trimmed);
        raw = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        const normalized = trimmed.replace(/^\[|\]$/g, '');
        raw = normalized.split(',').map((x: string) => x.trim()).filter(Boolean);
      }
    } else if (responseFarmIds && typeof responseFarmIds === 'object') {
      if ('id' in responseFarmIds) {
        raw = [(responseFarmIds as any).id];
      } else if (Array.isArray((responseFarmIds as any).items)) {
        raw = (responseFarmIds as any).items;
      } else {
        const values = Object.values(responseFarmIds);
        if (values.every((v) => ['string', 'number'].includes(typeof v))) {
          raw = values;
        }
      }
    } else if (product.farmId !== undefined && product.farmId !== null) {
      raw = [product.farmId];
    } else if (Array.isArray(product.farms) && product.farms.length) {
      raw = product.farms;
    }

    return raw
      .map((item: any) => this.normalizeId(item))
      .filter((val): val is number | string => val !== null);
  }

  private normalizeId(value: any): number | string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (typeof value === 'object') {
      const candidateKeys = ['id', 'value', 'farmId', 'FarmId', 'farmID', 'FarmID', 'idFarm', 'IdFarm', 'IDFarm', 'farm_id'];
      for (const key of candidateKeys) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          return this.normalizeId((value as any)[key]);
        }
      }
    }
    return null;
  }

  onFileChange(event: any) {
    const files: FileList = event.target.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      if (this.selectedFiles.length >= this.MAX_IMAGES) return;
      if (file.size > this.MAX_FILE_SIZE_BYTES) return;

      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (ev) => this.imagesPreview.push(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number, isExisting = false) {
    if (isExisting) {
      const img = this.existingImages[index];
      if (!img?.publicId) {
        this.existingImages.splice(index, 1);
        return;
      }
      this.imageSrv.deleteImagesByPublicIds([img.publicId]).subscribe(() => {
        this.existingImages.splice(index, 1);
      });
    } else {
      this.selectedFiles.splice(index, 1);
      this.imagesPreview.splice(index, 1);
    }
  }

  async submit() {
    if (this.isLoading) {
      return;
    }
    if (this.generalGroup.invalid || this.detallesGroup.invalid) {
      this.detallesGroup.markAllAsTouched();
      this.generalGroup.markAllAsTouched();
      this.showToast('Completa los campos obligatorios');
      return;
    }
    const creating = !this.isEdit;
    this.isLoading = true;
    const finish = () => {
      this.isLoading = false;
    };

    const g = this.generalGroup.getRawValue();
    const d = this.detallesGroup.getRawValue();

    if (g.price == null || d.categoryId == null) {
      finish();
      this.showToast('Completa los campos obligatorios');
      return;
    }

    const price = Number(g.price);
    const stock = Number(d.stock);
    const categoryId = Number(d.categoryId);
    const farmIds = (d.farmIds ?? [])
      .map((fid) => this.normalizeId(fid))
      .map((fid) => (typeof fid === 'string' ? Number(fid) : fid))
      .filter((fid): fid is number => typeof fid === 'number' && Number.isFinite(fid));

    if (!Number.isFinite(price) || !Number.isFinite(stock) || !Number.isFinite(categoryId) || !farmIds.length) {
      finish();
      this.showToast('Completa los campos obligatorios');
      return;
    }

    if (creating && this.selectedFiles.length === 0 && this.existingImages.length === 0) {
      finish();
      this.showToast('Agrega al menos una imagen');
      return;
    }

    if (creating) {
      const dto: ProductRegisterModel = {
        name: g.name,
        description: g.description,
        price,
        unit: g.unit,
        production: g.production,
        stock,
        status: d.status,
        categoryId,
        shippingIncluded: d.shippingIncluded,
        farmIds,
        images: this.selectedFiles,
      };

      const req$ = this.productSrv.create(dto);

      req$.pipe(
        take(1),
        catchError((err) => {
          console.error('Error creando producto', err, err?.data ?? (err as any)?.error);
          this.showAlert('Error', 'No se pudo crear el producto');
          return of(null);
        }),
        finalize(() => finish())
      ).subscribe(resp => {
        if (!resp) return;
        this.showToast('Producto creado');
        this.resetFormForCreate();
        this.router.navigateByUrl('/account/producer/product');
      });
      return;
    }

    if (!this.productId) {
      finish();
      this.showAlert('Error', 'No se encontró el producto a actualizar');
      return;
    }

    const dto: ProductUpdateModel = {
      id: this.productId,
      name: g.name,
      description: g.description,
      price,
      unit: g.unit,
      production: g.production,
      stock,
      status: d.status,
      categoryId,
      shippingIncluded: d.shippingIncluded,
      farmIds,
      images: this.selectedFiles,
    };

    const req$ = this.productSrv.update(dto);

    req$.pipe(
      take(1),
      catchError((err) => {
        console.error('Error actualizando producto', err, err?.data ?? (err as any)?.error);
        this.showAlert('Error', 'No se pudo actualizar');
        return of(null);
      }),
        finalize(() => finish())
      ).subscribe(resp => {
        if (!resp) return;
        this.showToast('Producto actualizado');
      this.router.navigateByUrl('/account/producer/product');
    });
  }

  async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }

  async showAlert(header: string, message: string) {
    const a = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await a.present();
  }
  goBack() {
    this.router.navigateByUrl('/account/producer/product');
  }
}
