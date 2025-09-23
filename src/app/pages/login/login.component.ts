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

    const {cuid, password} = this.formData.value;
    if (cuid == null || password == null) {
      return;
    }

    const res = await this.authService.login({cuid, password})
    res.subscribe({
      next: r => {
        const user = r.data

        this.localStorageService.saveData("token", user.token)

        if (user.role === 'ADMIN') {
          this.router.navigate(['/period']);
        } else if (user.role === 'EVALUATOR') {
          this.router.navigate(['/evaluator-candidacies']);
        } else {
          // rôle inconnu → déconnexion ou page par défaut
          this.router.navigate(['/login']);
        }
      },
      error: err => {
        this.isLoading = false
        console.log(err)
        this.errorMessage = 'Cuid ou mot de passe incorrect'
      }
    })

  }

}
