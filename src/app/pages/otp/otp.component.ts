import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connexion-otp',
  templateUrl: './otp.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OtpComponent implements OnInit, OnDestroy {
  // Variables OTP
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpValide: boolean = false;

  // Variables de compte à rebours
  tempsRestant: number = 180; // 10 minutes en secondes
  intervalId: any;

  // État des opérations
  envoiEnCours: boolean = false;
  verificationEnCours: boolean = false;

  // Messages
  errorMessage: string = '';
  emailMasque: string = 'ex***@domaine.com';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.demarrerCompteRebours();
    // Focus automatique sur le premier champ
    setTimeout(() => {
      const firstInput = document.querySelector('input[name="otp-digit-0"]') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Gestion de la saisie OTP
  onOTPInput(event: any, index: number): void {
    const input = event.target;
    let value = input.value;

    // Effacer les messages d'erreur
    this.errorMessage = '';

    // Ne garder que les chiffres
    if (!/^\d$/.test(value) && value !== '') {
      this.otpDigits[index] = '';
      return;
    }

    // Limiter à 1 caractère
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    this.otpDigits[index] = value;

    // Passer au champ suivant
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="otp-digit-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }, 10);
    }

    // Vérifier si l'OTP est complet
    this.verifierOTPComplet();
  }

  // Gestion du collage
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    // Remplir les champs
    digits.split('').forEach((digit, i) => {
      if (i < 6) {
        this.otpDigits[i] = digit;
      }
    });

    this.verifierOTPComplet();

    // Focus sur le dernier champ
    setTimeout(() => {
      const lastIndex = Math.min(5, digits.length - 1);
      const lastInput = document.querySelector(`input[name="otp-digit-${lastIndex}"]`) as HTMLInputElement;
      if (lastInput) {
        lastInput.focus();
      }
    }, 10);
  }

  onOTPKeyDown(event: KeyboardEvent, index: number): void {
    // Gestion de la touche Backspace
    if (event.key === 'Backspace') {
      // Si le champ est vide, aller au champ précédent
      if (!this.otpDigits[index] && index > 0) {
        setTimeout(() => {
          this.otpDigits[index - 1] = '';
          const prevInput = document.querySelector(`input[name="otp-digit-${index - 1}"]`) as HTMLInputElement;
          if (prevInput) {
            prevInput.focus();
          }
        }, 10);
      }
      // Vider le champ actuel
      this.otpDigits[index] = '';
    }

    // Gestion des flèches
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

  // Vérifier si l'OTP est complet
  verifierOTPComplet(): void {
    this.otpValide = this.otpDigits.every(digit => /^\d$/.test(digit));
  }

  // Soumission du formulaire
  verifierOTP(): void {
    if (!this.otpValide) {
      this.errorMessage = 'Veuillez saisir un code OTP valide à 6 chiffres.';
      return;
    }

    this.verificationEnCours = true;
    this.errorMessage = '';
    const otp = this.otpDigits.join('');

    console.log('OTP soumis:', otp);

    // Simulation d'appel API
    setTimeout(() => {
      this.verificationEnCours = false;

      // Simulation : vérifier si l'OTP est "123456" (pour test)
      if (otp === '123456') {
        // Redirection en cas de succès
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Code OTP incorrect. Veuillez réessayer.';
        this.reinitialiserOTP();
      }

      // Pour un vrai appel API :
      // this.authService.verifierOTP(otp).subscribe({
      //   next: (response) => {
      //     this.verificationEnCours = false;
      //     if (response.success) {
      //       this.router.navigate(['/dashboard']);
      //     } else {
      //       this.errorMessage = response.message || 'Code OTP incorrect.';
      //       this.reinitialiserOTP();
      //     }
      //   },
      //   error: (error) => {
      //     this.verificationEnCours = false;
      //     this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
      //     this.reinitialiserOTP();
      //   }
      // });
    }, 1500);
  }

  // Réinitialiser l'OTP
  reinitialiserOTP(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpValide = false;

    // Remettre le focus sur le premier champ
    setTimeout(() => {
      const firstInput = document.querySelector('input[name="otp-digit-0"]') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  // Renvoyer le code OTP
  renvoyerCode(): void {
    if (this.tempsRestant > 0 || this.envoiEnCours) {
      return;
    }

    this.envoiEnCours = true;
    this.errorMessage = '';

    console.log('Demande de renvoi du code OTP...');

    // Simulation d'envoi
    setTimeout(() => {
      this.envoiEnCours = false;

      // Réinitialiser le compte à rebours
      this.tempsRestant = 600;
      this.demarrerCompteRebours();

      // Réinitialiser les champs OTP
      this.reinitialiserOTP();

      // Message de succès (vous pouvez le remplacer par une notification toast)
      alert('Un nouveau code OTP a été envoyé à votre adresse email.');

      // Pour un vrai appel API :
      // this.authService.renvoyerOTP().subscribe({
      //   next: (response) => {
      //     this.envoiEnCours = false;
      //     if (response.success) {
      //       this.tempsRestant = 600;
      //       this.demarrerCompteRebours();
      //       this.reinitialiserOTP();
      //       // Afficher un message de succès
      //     } else {
      //       this.errorMessage = response.message || 'Erreur lors de l\'envoi du code.';
      //     }
      //   },
      //   error: (error) => {
      //     this.envoiEnCours = false;
      //     this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
      //   }
      // });
    }, 1000);
  }

  // Gestion du compte à rebours
  demarrerCompteRebours(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.tempsRestant > 0) {
        this.tempsRestant--;
      } else {
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

  // Formater le temps restant
  formatTempsRestant(): string {
    const minutes = Math.floor(this.tempsRestant / 60);
    const secondes = this.tempsRestant % 60;
    return `${minutes}:${secondes.toString().padStart(2, '0')}`;
  }

  // Navigation
  changerEmail(): void {
    this.router.navigate(['/login']);
  }

  // Méthode pour obtenir l'OTP complet
  getOTPComplet(): string {
    return this.otpDigits.join('');
  }
}
