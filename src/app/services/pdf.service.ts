import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private isInitialized = false;

  constructor() {
    this.initializePdfJs();
  }

  private initializePdfJs() {
    if (this.isInitialized) return;

    try {
      // Set up PDF.js worker with fallback options
      if (typeof window !== 'undefined' && 'Worker' in window) {
        // Use the specific version we have installed (3.11.174)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF.js:', error);
    }
  }

  async loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<any> {
    try {
      this.initializePdfJs();

      // Check if the array buffer is empty
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('The PDF file is empty, i.e. its size is zero bytes.');
      }

      // Check if the file has a valid PDF header
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file: File does not have a valid PDF header.');
      }

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        cMapUrl: '//cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });

      return await loadingTask.promise;
    } catch (error) {
      console.error('Error loading PDF document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load PDF: ${errorMessage}`);
    }
  }

  async renderPage(page: any, canvas: HTMLCanvasElement, scale: number = 1.0): Promise<void> {
    try {
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height, 'scale:', scale);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      console.log('PDF page rendered to canvas successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to render PDF page: ${errorMessage}`);
    }
  }

  createBlobUrl(arrayBuffer: ArrayBuffer, mimeType: string = 'application/pdf'): string {
    try {
      const blob = new Blob([arrayBuffer], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create blob URL: ${errorMessage}`);
    }
  }

  revokeBlobUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }

  async fetchCandidateEvaluationData(
    candidateId: number,
    periodId: number,
    candidacyService: any,
    criteriaService: any
  ): Promise<{
    candidateData: any;
    criteriaList: any[];
    evaluationResults: any[];
  }> {
    try {
      // Récupérer les données en parallèle
      const [candidateData, criteriaResponse, evaluationResponse] = await Promise.all([
        candidacyService.getCandidateDetails(candidateId).toPromise(),
        criteriaService.loadCriteriasByPeriodId(periodId, 'SELECTION').toPromise(),
        candidacyService.getCandidateEvaluationResultsByPeriod(candidateId, periodId).toPromise()
      ]);

      return {
        candidateData: candidateData?.data || candidateData,
        criteriaList: criteriaResponse?.data || [],
        evaluationResults: evaluationResponse?.data || []
      };
    } catch (error) {
      console.error('Erreur récupération données:', error);
      throw error;
    }
  }


  async generateEvaluationReport(
    candidateData: any,
    criteriaList: any[],
    evaluationResults: any[],
  ): Promise<void> {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      const darkColor = 51;
      const borderColor = 200;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      /* =========================
        EN-TÊTE AVEC IMAGES
      ========================== */
      const loadImage = async (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Taille optimale pour PDF
            const MAX_WIDTH = 200;
            const MAX_HEIGHT = 100;

            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            } else if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }

            canvas.width = width;
            canvas.height = height;

            // Fond blanc pour éviter le noir
            ctx!.fillStyle = 'white';
            ctx!.fillRect(0, 0, width, height);

            // Dessiner l'image
            ctx?.drawImage(img, 0, 0, width, height);

            const format = url.includes('fondationOrange') ? 'PNG' : 'JPEG';
            const quality = format === 'JPEG' ? 0.8 : 1.0;

            const compressedDataUrl = canvas.toDataURL(`image/${format.toLowerCase()}`, quality);

            resolve(compressedDataUrl);
          };

          img.onerror = reject;
          img.src = url + '?t=' + new Date().getTime();
        });
      };

      try {
        const [uboraLogo, fondationOrange] = await Promise.all([
          loadImage('/images/UboraLogo.png').catch(() => null),
          loadImage('/images/fondationOrange.png').catch(() => null)
        ]);

        // Image Ubora à gauche
        if (uboraLogo) {
          doc.addImage(uboraLogo, 'JPEG', 15, 10, 25, 12);
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0, 51, 102);
          doc.text('UBORA', 15, 20);
        }

        // Logo Fondation Orange à droite
        if (fondationOrange) {
          try {
            doc.addImage(fondationOrange, 'PNG', 170, 12, 25, 8);
          } catch (e) {
            console.log('PNG échoué, essaye JPEG pour fondationOrange');
            doc.addImage(fondationOrange, 'JPEG', 170, 10, 25, 8);
          }
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(255, 102, 0);
          doc.text('Fondation', 165, 15);
          doc.text('Orange', 165, 20);
        }

      } catch (error) {
        console.warn('Fallback texte pour logos');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text('UBORA', 20, 20);
        doc.setFontSize(12);
        doc.setTextColor(255, 102, 0);
        doc.text('Fondation Orange', 150, 20);
      }

      /* =========================
        TITRES
      ========================== */
      // Titre principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(darkColor, darkColor, darkColor);
      doc.text(
        'GRILLE D\'ÉVALUATION DE L\'ENTRETIEN',
        pageWidth / 2,
        28,
        { align: 'center' }
      );

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Bourses Ubora',
        pageWidth / 2,
        35,
        { align: 'center' }
      );

      // Ligne séparatrice
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      /* =========================
        INFORMATIONS CANDIDAT
      ========================== */
      let y = 50;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor, darkColor, darkColor);
      doc.text('Candidat :', 20, y);

      doc.setFont('helvetica', 'normal');
      const candidateName = `${candidateData.etn_nom} ${candidateData.etn_postnom} ${candidateData.etn_prenom}`;
      doc.text(candidateName, 50, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Université :', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(candidateData.universite_institut_sup || '-', 50, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Faculté :', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(candidateData.faculte || '-', 50, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Niveau d\'étude : ', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(this.getPromotionName(candidateData.promotion_academique) || '-', 50, y);

      y += 15;

      /* =========================
        CONFIGURATION DU TABLEAU POUR UNE SEULE PAGE
      ========================== */

      // Calculer la hauteur disponible pour le tableau
      const availableHeightForTable = pageHeight - y - 130; // 130 pour résultats + observation + pied de page

      // Déterminer la pondération maximale
      const maxPonderation = Math.max(...criteriaList.map(criteria => criteria.ponderation || 5));

      // Créer les en-têtes
      const headers = ['Critères'];
      for (let i = 1; i <= maxPonderation; i++) {
        headers.push(i.toString());
      }

      // Préparer les données du tableau
      const tableData = criteriaList.map((criteria: any) => {
        const result = evaluationResults.find(
          (r: any) => r.criteriaId === criteria.id
        );
        const score = Number(result?.result || 0);
        const ponderation = criteria.ponderation || 5;

        const row = [criteria.name];

        for (let i = 1; i <= maxPonderation; i++) {
          if (i <= ponderation) {
            row.push(score === i ? 'X' : '');
          } else {
            row.push('');
          }
        }

        return row;
      });

      // Titre section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('ÉVALUATION DES CRITÈRES', margin, y);

      y += 6;

      // Ajuster la taille de police en fonction du nombre de critères
      const fontSizeForTable = criteriaList.length > 8 ? 8 : 9;
      const rowHeight = criteriaList.length > 8 ? 8 : 10;

      // Configuration des colonnes optimisée pour une seule page
      const columnStyles: any = {};

      // Largeur de la colonne Critères (ajustable)
      const criteriaColWidth = criteriaList.length > 8 ? 70 : 80;
      const remainingWidth = contentWidth - criteriaColWidth;
      const scoreColWidth = remainingWidth / maxPonderation;

      // Configurer la première colonne
      columnStyles[0] = {
        halign: 'left',
        cellWidth: criteriaColWidth,
        fontStyle: 'bold',
        fontSize: fontSizeForTable,
        minCellHeight: rowHeight,
        cellPadding: { top: 2, right: 2, bottom: 2, left: 2 }
      };

      // Configurer chaque colonne de score
      for (let i = 1; i <= maxPonderation; i++) {
        columnStyles[i] = {
          cellWidth: scoreColWidth,
          halign: 'center',
          fontSize: fontSizeForTable,
          minCellHeight: rowHeight,
          cellPadding: 2
        };
      }

      // Utiliser autoTable avec configuration pour limiter à une page
      autoTable(doc, {
        startY: y,
        head: [headers],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: fontSizeForTable,
          textColor: [51, 51, 51],
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
          cellPadding: 2,
          valign: 'middle',
          overflow: 'linebreak',
          minCellHeight: rowHeight
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [51, 51, 51],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: fontSizeForTable,
          cellPadding: 2
        },
        columnStyles: columnStyles,
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        pageBreak: 'avoid', // Empêcher le saut de page
        didDrawPage: () => {
          // Empêcher l'ajout automatique de pages
          return false;
        }
      });

      /* =========================
        RÉSULTATS FINAUX
      ========================== */
      let yAfterTable = (doc as any).lastAutoTable?.finalY || y;
      yAfterTable += 10; // Espace après le tableau

      // Vérifier si on a assez d'espace pour les résultats
      const spaceNeeded = 60; // Hauteur nécessaire pour résultats + observation
      if (yAfterTable + spaceNeeded > pageHeight - 30) {
        // Si pas assez d'espace, réduire l'espacement
        yAfterTable -= 10;
      }

      // Calculer les scores
      const totalScore = evaluationResults.reduce(
        (sum: number, r: any) => sum + Number(r.result || 0),
        0
      );

      const maxScore = criteriaList.reduce(
        (sum: number, criteria: any) => sum + (criteria.ponderation || 5),
        0
      );

      // Cadre résultats
      const cadreHeight = 35;
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.setLineWidth(0.5);
      doc.rect(margin, yAfterTable, contentWidth, cadreHeight);

      // Titre "RÉSULTATS"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('RÉSULTATS', pageWidth / 2, yAfterTable + 10, { align: 'center' });

      // Positions pour alignement
      const leftColumnX = 30;
      const rightColumnX = 120;
      const row1Y = yAfterTable + 22;
      const row2Y = yAfterTable + 32;

      // Points
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor, darkColor, darkColor);
      doc.text('Total des points :', leftColumnX, row1Y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalScore}`, leftColumnX + 40, row1Y);

      // Note globale
      doc.setFont('helvetica', 'normal');
      doc.text('Note globale :', rightColumnX, row1Y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalScore}/${maxScore}`, rightColumnX + 40, row1Y);

      /* =========================
        OBSERVATION GÉNÉRALE
      ========================== */
      let observationY = yAfterTable + cadreHeight + 10;

      // S'assurer qu'on a assez d'espace
      if (observationY > pageHeight - 50) {
        // Réduire l'espacement si nécessaire
        observationY = yAfterTable + cadreHeight + 5;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('OBSERVATION GÉNÉRALE', margin, observationY);

      // Préparer le texte de l'observation
      const observationText = candidateData.observation || 'Aucune observation saisie.';
      const lineHeight = 5;
      const maxTextWidth = contentWidth - 10;

      // Diviser le texte
      const splitObservation = doc.splitTextToSize(observationText, maxTextWidth);

      // Calculer la hauteur nécessaire et limiter si besoin
      const maxLines = Math.floor((pageHeight - observationY - 40) / lineHeight);
      const linesToShow = Math.min(splitObservation.length, maxLines);
      const textHeight = linesToShow * lineHeight + 10;

      // Cadre d'observation
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.rect(margin, observationY + 5, contentWidth, textHeight);

      // Ajouter le texte
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(darkColor, darkColor, darkColor);

      let textY = observationY + 13;
      for (let i = 0; i < linesToShow; i++) {
        doc.text(splitObservation[i], margin + 5, textY);
        textY += lineHeight;
      }

      // Ajouter "..." si le texte est trop long
      if (splitObservation.length > maxLines) {
        doc.text('...', margin + 5, textY);
      }

      /* =========================
        PIED DE PAGE
      ========================== */
      const footerY = pageHeight - 20;
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Bourses Ubora',
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      /* =========================
        SAUVEGARDE
      ========================== */
      const safeFileName = `${candidateData.etn_nom}_${candidateData.etn_postnom}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\s-]/g, '')
        .replace(/\s+/g, '_')
        .toUpperCase();

      const fileName = `EVALUATION_${safeFileName}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);

    } catch (error) {
      console.error('Erreur génération PDF :', error);
      throw new Error('Impossible de générer le rapport PDF');
    }
  }


  promotionMap: { [key: string]: string } = {
    'L0' : 'Préparatoire',
    'L1': 'Licence 1',
    'L2': 'Licence 2',
    'L3': 'Licence 3',
    'L4' : 'LICENCE 4',
    'B1' : 'BACHELOR 1',
    'B2' : 'Bachelor 2',
    'B3' : 'Bachelor 3',
    'B4' : 'Bachelor 4',
    'M1': 'Master 1',
    'M2': 'Master 2',
    'D1': 'Doctorat 1',
    'D2': 'Doctorat 2',
    'D3': 'Doctorat 3',
    'D4': 'Doctorat 4',
    'D5': 'Doctorat 5',
    'D6': 'Doctorat 6'
  };

  getPromotionName(promo?: string): string {
    return this.promotionMap[promo || ''] || promo || 'Non renseigné';
  }
}
