import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthServices } from '../../services/auth.service';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-connexion-otp',
  templateUrl: './otp.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OtpComponent implements OnInit, OnDestroy {
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpValide: boolean = false;
  tempsRestant: number = 180; // 3 minutes
  intervalId: any;
  envoiEnCours: boolean = false;
  verificationEnCours: boolean = false;

  errorMessage: string = '';
  successMessage: string = '';
  destinataireMasque: string = '';
  channel: 'email' | 'phone' = 'email'; 
  cuid: string = '';

  // bloquer le formulaire
  tentativesEchouees: number = 0;
  maxTentatives: number = 5; 
  formulaireBloque: boolean = false;
  delaiBlocageMs: number = 5 * 60 * 1000; // 5 minutes 
  
  constructor(
    private router: Router,
    private authService: AuthServices,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    const userData = this.localStorageService.getData('user');
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    const parsed = JSON.parse(userData);
    this.cuid = parsed.cuid || '';
    this.channel = parsed.channel === 'phone' ? 'phone' : 'email';
    this.destinataireMasque = parsed.emailMasque || (this.channel === 'email' ? 'votre email' : 'votre téléphone');

    if(parsed.otpSent === true){
      this.successMessage = this.channel === 'email' 
        ? `Un code a été envoyé à l'adresse : ${this.destinataireMasque}`
        : `Un code a été envoyé par SMS au numéro : ${this.destinataireMasque}`
    }

    this.demarrerCompteRebours();
    parsed.otpSent = false
    this.localStorageService.saveData('user',JSON.stringify(parsed))

    setTimeout(() => {
      const firstInput = document.querySelector('input[name="otp-digit-0"]') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  onOTPInput(event: any, index: number): void {
    const input = event.target;
    let value = input.value;
    // Effacer l'erreur dès qu'on tape
    this.errorMessage = ''; 

    if (!/^\d$/.test(value) && value !== '') {
      this.otpDigits[index] = '';
      return;
    }
    if (value.length > 1) value = value.charAt(value.length - 1);
    this.otpDigits[index] = value;

    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="otp-digit-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }, 10);
    }

    this.verifierOTPComplet();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    digits.split('').forEach((digit, i) => {
      if (i < 6) this.otpDigits[i] = digit;
    });
    this.verifierOTPComplet();
    setTimeout(() => {
      const lastIndex = Math.min(5, digits.length - 1);
      const lastInput = document.querySelector(`input[name="otp-digit-${lastIndex}"]`) as HTMLInputElement;
      if (lastInput) lastInput.focus();
    }, 10);
  }

  onOTPKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        setTimeout(() => {
          this.otpDigits[index - 1] = '';
          const prevInput = document.querySelector(`input[name="otp-digit-${index - 1}"]`) as HTMLInputElement;
          if (prevInput) prevInput.focus();
        }, 10);
      }
      this.otpDigits[index] = '';
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const prevInput = document.querySelector(`input[name="otp-digit-${index - 1}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      const nextInput = document.querySelector(`input[name="otp-digit-${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  verifierOTPComplet(): void {
    this.otpValide = this.otpDigits.every(d => /^\d$/.test(d));
  }

  verifierOTP(): void {

     if (this.formulaireBloque) {
      this.errorMessage = 'Trop de tentatives échouées. Veuillez renvoyer un nouveau code.';
      return;
    }

    if (!this.otpValide) {
      this.errorMessage = 'Veuillez saisir un code OTP valide à 6 chiffres.';
      return;
    }
    if (!this.cuid) {
      this.errorMessage = 'Données utilisateur manquantes. Veuillez recommencer.';
      return;
    }

    this.verificationEnCours = true;
    this.errorMessage = '';
    this.successMessage = "";
    const otp = this.otpDigits.join('');

    this.authService.verifyOtp({ cuid: this.cuid, otp }).subscribe({
      next: (response) => {
        this.verificationEnCours = false;

        if (response.success === true && response.user) {
          this.localStorageService.saveData('user', JSON.stringify(response.user));
          this.localStorageService.saveData('token', response.user.token);

          this.errorMessage = ''; 
          this.successMessage = 'Code vérifié avec succès ! Connexion en cours…';
          this.formulaireBloque = true;
          setTimeout(() => {
            if (response.user.role === 'ADMIN') {
              this.router.navigate(['/period']);
            } else if (response.user.role === 'EVALUATOR') {
              this.router.navigate(['/']);
            } else {
              this.router.navigate(['/login']);
            }
          }, 2000)
        }
        else if (response.success === false) {
          const errorMsg = response.error || 'Une erreur est survenue. Veuillez réessayer.';
          this.errorMessage = errorMsg;
          this.tentativesEchouees++;

          if (this.tentativesEchouees >= this.maxTentatives) {
            this.formulaireBloque = true;
            this.errorMessage = 'Trop de tentatives échouées. Veuillez renvoyer un nouveau code.';

            // Optionnel : réactiver automatiquement après X minutes
            setTimeout(() => {
              this.formulaireBloque = false;
              this.tentativesEchouees = 0;
            }, this.delaiBlocageMs);
          }
          // Redirection auto si session expirée
          if (errorMsg.toLowerCase().includes('expire')) {
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 4000);
          }

          this.reinitialiserOTP();
        }
        else {
          this.errorMessage = 'Réponse invalide du serveur.';
          this.reinitialiserOTP();
        }
      },
      error: (err) => {
        this.verificationEnCours = false;
        this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        this.reinitialiserOTP();
      }
    });
  }

  reinitialiserOTP(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpValide = false;
    setTimeout(() => {
      const firstInput = document.querySelector('input[name="otp-digit-0"]') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 100);
  }

  renvoyerCode(): void {
    if (this.tempsRestant > 0 || this.envoiEnCours) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.envoiEnCours = true;
    
    this.authService.resendOtp(this.cuid).subscribe({
      next: (response) => {
        this.envoiEnCours = false;

        if (response?.success) {
          // Réinitialiser les états de sécurité
          this.tentativesEchouees = 0;
          this.formulaireBloque = false;

          // Redémarrer le timer (10 minutes)
          this.tempsRestant = 180;
          this.demarrerCompteRebours();

          // Vider les champs OTP
          this.reinitialiserOTP();

          if (this.channel === 'email') {
            this.successMessage = `Un nouveau code a été envoyé à : ${this.destinataireMasque}`;
          } else {
            this.successMessage = `Un nouveau code a été envoyé au numéro : ${this.destinataireMasque}`;
          }

          // Masquer le message après 5 secondes
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        } else {
          // Gérer les erreurs métier (ex: session expirée)
          this.errorMessage = response?.message || 'Impossible de renvoyer le code.';
        }
      },
      error: (err) => {
        this.envoiEnCours = false;
        this.errorMessage = 'Erreur réseau. Veuillez vérifier votre connexion.';
      }
    });  
  }

  demarrerCompteRebours(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.tempsRestant > 0) this.tempsRestant--;
      else clearInterval(this.intervalId);
    }, 1000);
  }

  formatTempsRestant(): string {
    const minutes = Math.floor(this.tempsRestant / 60);
    const secondes = this.tempsRestant % 60;
    return `${minutes}:${secondes.toString().padStart(2, '0')}`;
  }

  changerEmail(): void {
    this.router.navigate(['/login']);
  }
}