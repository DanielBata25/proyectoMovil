import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/shared/services/product/product.service';
import { CategoryService } from 'src/app/features/parameters/services/category/category.service';
import { FarmService } from 'src/app/shared/services/farm/farm.service';
import { CategorySelectModel } from 'src/app/features/parameters/models/category/category.model';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private farmService = inject(FarmService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  form!: FormGroup;
  categories: CategorySelectModel[] = [];
  farms: FarmSelectModel[] = [];
  selectedFiles: File[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      price: [null, [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      production: ['', [Validators.required, Validators.maxLength(100)]],
      farmId: [null, Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      status: [true, Validators.required],
      categoryId: [null, Validators.required]
    });

    this.categoryService.getAll().subscribe(c => this.categories = c ?? []);
    this.farmService.getAll().subscribe(f => this.farms = f ?? []);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);

    this.selectedFiles = [];
    files.forEach(f => {
      if (f.size / (1024 * 1024) <= 5) this.selectedFiles.push(f);
    });
  }

  async registerProduct() {
    if (this.form.invalid) {
      const toast = await this.toastCtrl.create({ message: 'Formulario incompleto', duration: 2000, color: 'danger' });
      await toast.present();
      return;
    }

    // aquí llamarías a productService.create(...) con formData
    const toast = await this.toastCtrl.create({ message: 'Producto creado (simulado)', duration: 2000, color: 'success' });
    await toast.present();

    this.router.navigate(['/account/producer/product']);
  }
}
