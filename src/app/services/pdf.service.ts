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
    evaluationResults: any[]
  ): Promise<void> {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      const darkColor = 51;
      const borderColor = 200;

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

            // Pour fondationOrange, essayer PNG pour garder la transparence
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

        // Image Coeur à gauche
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
          // Essayer PNG d'abord, si problème, essayer JPEG
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
        105,
        28, // Position ajustée
        { align: 'center' }
      );

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Bourses Ubora - Fondation Orange',
        105,
        35, // Position ajustée
        { align: 'center' }
      );

      // Ligne séparatrice - PLACÉE APRÈS les titres
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.setLineWidth(0.5);
      doc.line(15, 40, 195, 40); // À 40mm du haut

      /* =========================
        INFORMATIONS CANDIDAT
      ========================== */
      let y = 50;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkColor, darkColor, darkColor);
      doc.text('Candidat :', 20, y);

      doc.setFont('helvetica', 'normal');
      doc.text(
        `${candidateData.etn_nom} ${candidateData.etn_postnom} ${candidateData.etn_prenom}`,
        50,
        y
      );

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Université :', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(candidateData.universite_institut_sup || '-', 50, y);

      y += 8; // Descendre d'une ligne
      doc.setFont('helvetica', 'bold');
      doc.text('Niveau d\'étude : ', 20, y); // Même colonne gauche
      doc.setFont('helvetica', 'normal');
      doc.text(this.getPromotionName(candidateData.promotion_academique) || '-', 50, y);

      y += 8; //

      /* =========================
        TABLEAU DES CRITÈRES
      ========================== */
      y += 12;

      const tableData = criteriaList.map((criteria: any) => {
        const result = evaluationResults.find(
          (r: any) => r.criteriaId === criteria.id
        );
        const score = Number(result?.result || 0);

        return [
          criteria.name,
          score === 1 ? 'X' : '',
          score === 2 ? 'X' : '',
          score === 3 ? 'X' : '',
          score === 4 ? 'X' : '',
          score === 5 ? 'X' : ''
        ];
      });

      // Titre section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('ÉVALUATION DES CRITÈRES', 20, y);

      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['Critères', '1', '2', '3', '4', '5']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 10,
          textColor: [51, 51, 51],
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
          cellPadding: 4,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [51, 51, 51],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { // Première colonne - AUGMENTEZ la largeur
            halign: 'left',
            cellWidth: 100, // ◄◄◄ Augmenté de 90 à 100
            fontStyle: 'bold',
            fontSize: 9
          },
          1: {
            cellWidth: 16,
            halign: 'center',
            fontSize: 9
          },
          2: {
            cellWidth: 16,
            halign: 'center',
            fontSize: 9
          },
          3: {
            cellWidth: 16,
            halign: 'center',
            fontSize: 9
          },
          4: {
            cellWidth: 16,
            halign: 'center',
            fontSize: 9
          },
          5: {
            cellWidth: 16,
            halign: 'center',
            fontSize: 9
          }
        },
        margin: { left: 15, right: 15 } // ◄◄◄ IMPORTANT: Même marge partout
      });
      /* =========================
        RÉSULTATS FINAUX
      ========================== */
      const yAfterTable = (doc as any).lastAutoTable.finalY + 10;

      const totalScore = evaluationResults.reduce(
        (sum: number, r: any) => sum + Number(r.result || 0),
        0
      );

      const maxScore = criteriaList.length * 5;

      // Augmenter la hauteur du cadre pour plus d'espace
      const cadreHeight = 30;
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.setLineWidth(0.5);
      doc.rect(15, yAfterTable, 180, cadreHeight);

      // Titre "RÉSULTATS"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('RÉSULTATS', 105, yAfterTable + 10, { align: 'center' });

      // Points
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor, darkColor, darkColor);
      doc.text('Total des points :', 25, yAfterTable + 20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalScore}`, 85, yAfterTable + 20);

      // Note globale
      doc.setFont('helvetica', 'normal');
      doc.text('Note globale :', 105, yAfterTable + 20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalScore}/${maxScore}`, 145, yAfterTable + 20);


      /* =========================
        COMMENTAIRE GÉNÉRAL - AVEC ESPACE AUGMENTÉ
      ========================== */
      const commentY = yAfterTable + cadreHeight + 20; // ◄◄◄ ESPACE AUGMENTÉ ICI

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('COMMENTAIRE GÉNÉRAL', 15, commentY);

      // Cadre pour commentaire (peut réduire la hauteur si besoin d'espace)
      const commentCadreHeight = 35;
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.rect(15, commentY + 5, 180, commentCadreHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(darkColor, darkColor, darkColor);

      const comment = candidateData.commentaire || 'Aucun commentaire saisi.';
      const splitComment = doc.splitTextToSize(comment, 175);

      doc.text(splitComment, 20, commentY + 13);

      /* =========================
        PIED DE PAGE
      ========================== */
      const pageHeight = doc.internal.pageSize.height;

      // Ligne séparatrice du pied de page
      doc.setDrawColor(borderColor, borderColor, borderColor);
      doc.line(15, pageHeight - 20, 195, pageHeight - 20);

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
        105,
        pageHeight - 15,
        { align: 'center' }
      );

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Bourses Ubora - Fondation Orange',
        105,
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

      const pdfOutput = doc.output('arraybuffer');
      console.log(`Taille PDF final: ${(pdfOutput.byteLength / 1024).toFixed(1)} KB`);

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
