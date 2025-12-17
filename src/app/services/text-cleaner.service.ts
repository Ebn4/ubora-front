import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextCleanerService {

  /**
   * Nettoie le texte en remplaçant les underscores par des espaces
   * et en ajoutant la ponctuation manquante
   */
  cleanCSVText(text: string): string {
    if (!text) return '';

    // 1. Remplacer les underscores par des espaces
    let cleaned = text.replace(/_/g, ' ');

    // 2. Ajouter des espaces après la ponctuation manquante
    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

    // 3. Corriger les années collées aux mots
    cleaned = cleaned.replace(/(\d{4})([a-zA-Z])/g, '$1 $2');

    // 4. Ajouter la ponctuation manquante après les dates
    cleaned = cleaned.replace(/(2025)(objet)/gi, '$1\n\n$2');

    // 5. Mettre en majuscule après un point
    cleaned = cleaned.replace(/\.\s*([a-z])/g, (match, p1) => '. ' + p1.toUpperCase());

    return cleaned;
  }

  /**
   * Nettoie spécifiquement les lettres de motivation
   */
  cleanMotivationLetter(text: string): string {
    if (!text) return '';

    let cleaned = this.cleanCSVText(text);

    // Formater spécifiquement pour une lettre
    cleaned = this.formatAsLetter(cleaned);

    return cleaned;
  }

  /**
   * Formate le texte comme une lettre formelle
   */
  private formatAsLetter(text: string): string {
    // Diviser en paragraphes basés sur les points
    const sentences = text.split('.');

    // Reconstruire avec des sauts de ligne après chaque phrase
    const paragraphs = sentences
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .map((sentence, index) => {
        // Ajouter le point manquant
        return sentence + (sentence && !sentence.endsWith('.') ? '.' : '');
      });

    return paragraphs.join('\n\n');
  }

  /**
   * Nettoie et met en forme les noms propres
   */
  cleanProperNames(text: string): string {
    if (!text) return '';

    // Remplacer les underscores
    let cleaned = text.replace(/_/g, ' ');

    // Mettre en majuscule la première lettre de chaque mot
    cleaned = cleaned.replace(/\b\w/g, char => char.toUpperCase());

    return cleaned;
  }
}
