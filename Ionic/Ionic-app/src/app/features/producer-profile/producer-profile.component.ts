import { Component, Input } from '@angular/core';
import { 
  FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors, ValidatorFn 
} from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProducerSelectModel, ProducerSocialCreateModel, SocialNetwork } from 'src/app/shared/models/producer/producer.model';

// 👉 Validador de redes únicas tipado como ValidatorFn (Angular exige esto)
const distinctNetworksValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const fa = control as FormArray;
  const vals = fa.controls.map(c => c.get('network')?.value);
  const set = new Set(vals);
  return set.size !== vals.length ? { duplicateNetwork: true } : null;
};

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './producer-profile.component.html',
  styleUrls: ['./producer-profile.component.scss']
})
export class ProducerProfileComponent {
  @Input() producer?: ProducerSelectModel;

  SocialNetwork = SocialNetwork;
  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private modalCtrl: ModalController) {
    this.form = this.fb.group({
      description: ['', [Validators.maxLength(500)]],
      //  aquí ya no da error porque el validador está tipado
      socialLinks: this.fb.array([], [distinctNetworksValidator])
    });
  }

  ngOnInit() {
    if (this.producer) {
      this.form.patchValue({ description: this.producer.description ?? '' });
      // tu modelo ProducerSelectModel no tiene `networks`
      // → el usuario podrá añadir redes manualmente con addSocialLink()
    }
  }

  get socialLinksFA(): FormArray {
    return this.form.get('socialLinks') as FormArray;
  }

  get socialLinksControls() {
    return this.socialLinksFA.controls as FormGroup[];
  }

  addSocialLink() {
    this.socialLinksFA.push(this.fb.group({
      network: [SocialNetwork.Website, [Validators.required]],
      url: ['', [Validators.required, Validators.maxLength(512)]]
    }));
  }

  removeSocialLink(i: number) {
    this.socialLinksFA.removeAt(i);
  }

  close() {
    this.modalCtrl.dismiss();
  }

  submit() {
    if (this.form.invalid) return;

    const description = (this.form.value.description ?? '').trim();

    const socialLinks = (this.form.value.socialLinks as ProducerSocialCreateModel[])
      ?.filter(x => x && x.url && x.url.trim().length > 0);

    const payload = {
      description,
      socialLinks: socialLinks && socialLinks.length > 0 ? socialLinks : undefined
    };

    this.modalCtrl.dismiss(payload);
  }
}
