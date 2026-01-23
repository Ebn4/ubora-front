import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {NgClass, NgIf} from '@angular/common';
import {LocalStorageService} from '../../services/local-storage.service';
import {AuthServices} from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    FormsModule
  ],
  styles: ``
})
export default class LoginComponent {

  isLoading = false;
  errorMessage = '';
  authService: AuthServices = inject(AuthServices)
  localStorageService: LocalStorageService = inject(LocalStorageService)
  router: Router = inject(Router)

  formData = new FormGroup({
    cuid: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  })

  async onSubmit() {
    if (this.formData.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.isLoading = true;

    const {cuid, password} = this.formData.value;
    if (cuid == null || password == null) {
      return;
    }

    const res = await this.authService.login({cuid, password})
    res.subscribe({
      next: r => {
        if(r.success && r.data){
          this.isLoading = false
          // Stocker CUID et email masqué pour OTP
          this.localStorageService.saveData('user', JSON.stringify({
            cuid,
            emailMasque: r.data?.reference_masked || null,
            channel : r.data?.channel,
            otpSent : true
          }));  
          // Rediriger vers page OTP
          this.router.navigate(['/otp']);
        }else{
           this.errorMessage = r.error || 'Erreur inconnue.';
        }
          this.isLoading = false
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = 'Cuid ou mot de passe incorrect';
      }
  })
  }

}
