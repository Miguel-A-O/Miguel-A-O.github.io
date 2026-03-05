// pdf.js
document.addEventListener('DOMContentLoaded', function() {
  const url = 'assets/articulos1.pdf';

  // 1. Initialize PDF.js Library
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // 2. Get Elements
  const container = document.getElementById('pdf-viewer');
  const canvas = document.getElementById('pdf-canvas');
  const textLayerDiv = document.getElementById('text-layer');
  const annotationLayerDiv = document.getElementById('annotation-layer');
  const pageNumSpan = document.getElementById('page-num');
  const pageCountSpan = document.getElementById('page-count');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  let pdfDoc = null;
  let pageNum = 1;
  let scale = 1.2; // Zoom level

  // 3. Render Function
  function renderPage(num) {
    pdfDoc.getPage(num).then(function(page) {
      const viewport = page.getViewport({ scale: scale });

      // A. Render Canvas
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const ctx = canvas.getContext('2d');
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      page.render(renderContext);

      // B. Prepare Container dimensions
      container.style.width = `${viewport.width}px`;
      container.style.height = `${viewport.height}px`;

      // C. Render Text Layer (Selection)
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;
      
      page.getTextContent().then(function(textContent) {
        // Use the modern renderTextLayer function
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        });
      });

      // D. Render Annotation Layer (Links)
      annotationLayerDiv.innerHTML = '';
      annotationLayerDiv.style.width = `${viewport.width}px`;
      annotationLayerDiv.style.height = `${viewport.height}px`;

      page.getAnnotations().then(function(annotations) {
        // Use the modern AnnotationLayer class
        const annotationLayer = new pdfjsLib.AnnotationLayer({
          div: annotationLayerDiv,
          page: page,
          viewport: viewport,
          linkService: new pdfjsLib.SimpleLinkService(), // Handles link clicks
          renderInteractiveForms: true
        });
        annotationLayer.render({ annotations });
      });

      // Update UI
      pageNumSpan.textContent = num;
    });
  }

  // 4. Navigation Logic
  function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    renderPage(pageNum);
  }

  function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    renderPage(pageNum);
  }

  prevBtn.addEventListener('click', onPrevPage);
  nextBtn.addEventListener('click', onNextPage);

  // 5. Load PDF
  pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    pageCountSpan.textContent = pdfDoc.numPages;
    renderPage(pageNum);
  }).catch(function(error) {
    console.error("Error loading PDF:", error);
    container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar el PDF.</p>';
  });
});