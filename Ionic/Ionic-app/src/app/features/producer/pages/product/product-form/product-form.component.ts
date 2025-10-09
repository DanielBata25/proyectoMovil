import { CommonModule } from '@angular/common';
import {
  Component, OnInit, inject, signal
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup,
  ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  IonicModule, AlertController, ToastController, LoadingController
} from '@ionic/angular';

import {
  ProductSelectModel, ProductImageSelectModel,
  ProductRegisterModel, ProductUpdateModel, ApiOk

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

  generalGroup!: FormGroup;
  detallesGroup!: FormGroup;

  isEdit = false;
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
    this.initForms();
    this.loadCategories();
    this.loadFarm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEdit = true;
        this.productId = Number(idParam);
        this.loadProduct(this.productId);
      }
    });
  }

  private initForms(): void {
    this.generalGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), notWhiteSpaceValidator('Nombre')]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500), notWhiteSpaceValidator('Descripción')]],
      price: [null, [Validators.required, Validators.min(0), Validators.max(100_000_000), Validators.pattern(/^\d+$/)]],
      unit: ['', [Validators.required, Validators.maxLength(20), notWhiteSpaceValidator('Unidad')]],
      production: ['', [Validators.required, Validators.maxLength(150), notWhiteSpaceValidator('Producción')]],
    });

    this.detallesGroup = this.fb.group({
      stock: [0, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.max(100_000)]],
      status: [true, Validators.required],
      categoryId: [null, [Validators.required, positiveIntValidator('Categoría')]],
      farmIds: new FormControl<number[]>([], { nonNullable: true, validators: [arrayMinLen(1)] }),
      shippingIncluded: [false],
    });
  }

  private loadProduct(id: number) {
    this.isLoading = true;
    this.productSrv.getById(id).subscribe({
      next: (p) => {
        this.generalGroup.patchValue(p);
        this.detallesGroup.patchValue(p);
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
    if (!this.isEdit && this.totalImages === 0) {
      this.showToast('Debes agregar al menos una imagen');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: this.isEdit ? 'Actualizando...' : 'Creando...' });
    await loading.present();

    const g = this.generalGroup.value;
    const d = this.detallesGroup.value;
    const base = {
      ...g,
      ...d,
      farmIds: d.farmIds ?? []
    };

    const dto: ProductUpdateModel | ProductRegisterModel = this.isEdit
      ? { id: this.productId!, ...base, images: this.selectedFiles }
      : { ...base, images: this.selectedFiles };

    const req$ = this.isEdit ? this.productSrv.update(dto as ProductUpdateModel) : this.productSrv.create(dto as ProductRegisterModel);

    req$.pipe(
      take(1),
      catchError(() => {
        this.showAlert('Error', this.isEdit ? 'No se pudo actualizar' : 'No se pudo crear');
        return of(null);
      }),
      finalize(() => loading.dismiss())
    ).subscribe(resp => {
      if (!resp) return;
      this.showToast(this.isEdit ? 'Producto actualizado' : 'Producto creado');
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
