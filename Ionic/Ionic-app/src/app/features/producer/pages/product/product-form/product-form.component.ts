import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl,
  ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  IonicModule, AlertController, ToastController, LoadingController
} from '@ionic/angular';

import {
  ProductImageSelectModel,
  ProductUpdateModel,
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
    const v = c.value as number[] | null | undefined;
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
  private loadingCtrl = inject(LoadingController);

  private productSrv = inject(ProductService);
  private imageSrv = inject(ProductImageService);
  private farmService = inject(FarmService);
  private categoryService = inject(CategoryService);

  farms: any[] = [];
  categories: any[] = [];

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
    farmIds: this.fb.nonNullable.control<number[]>([], {
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

  stepControl = new FormControl<'general' | 'detalles' | 'imagenes'>('general', { nonNullable: true });

  // Helpers
  get totalImages(): number { return this.selectedFiles.length + this.existingImages.length; }
  get canAddMore(): boolean { return this.totalImages < this.MAX_IMAGES; }

  ngOnInit(): void {
    this.loadCategories();
    this.loadFarm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        console.warn('No se proporciono id de producto para editar');
        return;
      }
      this.productId = Number(idParam);
      this.loadProduct(this.productId);
    });
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

        const farmIds = Array.isArray((p as any).farmIds) && (p as any).farmIds.length
          ? (p as any).farmIds
          : ((p as any).farmId ? [(p as any).farmId] : []);

        this.detallesGroup.patchValue({
          stock: p.stock,
          status: p.status,
          categoryId: p.categoryId,
          farmIds,
          shippingIncluded: (p as any).shippingIncluded ?? false,
        });

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
    this.farmService.getByProducer().subscribe((d) => this.farms = d ?? []);
  }

  loadCategories() {
    this.categoryService.getAll().subscribe((d) => this.categories = d ?? []);
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
    if (this.generalGroup.invalid || this.detallesGroup.invalid) {
      this.showToast('Completa los campos obligatorios');
      return;
    }
    if (!this.productId) {
      this.showAlert('Error', 'No se encontro el producto a actualizar');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Actualizando...' });
    await loading.present();

    const g = this.generalGroup.getRawValue();
    const d = this.detallesGroup.getRawValue();

    if (g.price == null || d.categoryId == null) {
      await loading.dismiss();
      this.showToast('Completa los campos obligatorios');
      return;
    }

    const dto: ProductUpdateModel = {
      id: this.productId,
      name: g.name,
      description: g.description,
      price: g.price,
      unit: g.unit,
      production: g.production,
      stock: d.stock,
      status: d.status,
      categoryId: d.categoryId,
      shippingIncluded: d.shippingIncluded,
      farmIds: d.farmIds,
      images: this.selectedFiles,
    };

    const req$ = this.productSrv.update(dto);

    req$.pipe(
      take(1),
      catchError(() => {
        this.showAlert('Error', 'No se pudo actualizar');
        return of(null);
      }),
      finalize(() => loading.dismiss())
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
