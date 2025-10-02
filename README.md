# 📄 PDF Werkzeuge - Professionelle PDF-Manipulation

Eine moderne, benutzerfreundliche Webanwendung zum Aufteilen und Zusammenfügen von PDF-Dokumenten mit erweiterten Features und professioneller Benutzeroberfläche.

## ✨ Features

### 🔧 Kernfunktionen
- **PDF Splitten**: Aufteilen von PDFs in einzelne Seiten mit Vorschau
- **PDF Zusammenfügen**: Mehrere PDFs zu einer Datei zusammenfügen
- **Seitenauswahl**: Flexible Auswahl der zu verarbeitenden Seiten
- **Drag & Drop**: Intuitive Datei-Upload-Funktionalität
- **Vorschau**: Thumbnail-Vorschau aller Seiten

### 🎨 Moderne UI/UX
- **Dark Mode**: Automatischer und manueller Dark Mode
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **Progress Indicators**: Echtzeit-Fortschrittsanzeigen
- **Toast Notifications**: Benutzerfreundliche Benachrichtigungen
- **Keyboard Shortcuts**: Schnelle Navigation mit Tastatur
- **Accessibility**: Vollständige Barrierefreiheit (WCAG 2.1)

### 🚀 Erweiterte Features
- **Progressive Web App (PWA)**: Installierbar als native App
- **Offline-Funktionalität**: Service Worker für Offline-Nutzung
- **Performance-Optimierung**: Chunked Processing für große PDFs
- **Fehlerbehandlung**: Robuste Fehlerbehandlung mit detaillierten Meldungen
- **Validierung**: Umfassende Datei- und Sicherheitsvalidierung
- **Bulk Operations**: Alle Seiten auf einmal herunterladen

### 🔒 Sicherheit & Validierung
- **Dateigrößen-Limits**: Maximale Dateigröße von 50MB
- **Dateityp-Validierung**: Nur PDF-Dateien erlaubt
- **Client-side Processing**: Keine Server-Kommunikation
- **Memory Management**: Optimierte Speichernutzung

## 🛠 Technische Details

### Technologie-Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **PDF-Verarbeitung**: PDF-lib, PDF.js
- **Styling**: CSS3 mit Custom Properties
- **PWA**: Service Worker, Web App Manifest
- **Drag & Drop**: SortableJS
- **Build**: Keine Build-Pipeline erforderlich

### Browser-Unterstützung
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance
- **Lazy Loading**: Vorschau-Bilder werden on-demand geladen
- **Chunked Processing**: Große PDFs werden in Chunks verarbeitet
- **Memory Optimization**: Automatische Speicherbereinigung
- **Web Workers**: Schwere Verarbeitung im Hintergrund

## 📱 PWA Features

### Installation
- **App Manifest**: Vollständige PWA-Konfiguration
- **Service Worker**: Offline-Caching und Background Sync
- **Install Prompt**: Automatische Installationsaufforderung
- **App Shortcuts**: Schnellzugriff auf Split/Merge-Modi

### Offline-Funktionalität
- **Caching**: Statische Ressourcen werden gecacht
- **Background Processing**: Verarbeitung läuft auch offline
- **Sync**: Automatische Synchronisation bei Netzwerkverbindung

## ♿ Accessibility

### WCAG 2.1 Konformität
- **Keyboard Navigation**: Vollständige Tastatursteuerung
- **Screen Reader**: ARIA-Labels und semantisches HTML
- **Focus Management**: Sichtbare Fokus-Indikatoren
- **Color Contrast**: Hoher Kontrast für bessere Lesbarkeit
- **Reduced Motion**: Unterstützung für `prefers-reduced-motion`

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Dark Mode umschalten
- `Escape`: Aktuelle Ansicht zurücksetzen
- `Tab`: Navigation zwischen Elementen
- `Enter/Space`: Buttons aktivieren

## 🎯 Verwendung

### PDF Splitten
1. **Datei hochladen**: Drag & Drop oder Klick zum Auswählen
2. **Seiten auswählen**: Alle, ungerade, gerade oder individuelle Auswahl
3. **Verarbeitung**: Automatische Aufteilung mit Fortschrittsanzeige
4. **Download**: Einzelne Seiten oder alle auf einmal

### PDF Zusammenfügen
1. **Dateien hochladen**: Mehrere PDFs gleichzeitig
2. **Reihenfolge**: Drag & Drop zum Neuordnen
3. **Verarbeitung**: Automatische Zusammenfügung
4. **Download**: Zusammengefügte PDF herunterladen

## 🔧 Konfiguration

### Umgebungsvariablen
```javascript
const CONFIG = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_FILES: 10,
    SUPPORTED_TYPES: ['application/pdf'],
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks
    PREVIEW_SCALE: 0.3,
    THUMBNAIL_SCALE: 0.5
};
```

### Anpassungen
- **Themes**: CSS Custom Properties für einfache Anpassung
- **Sprachen**: Deutsche Lokalisierung (erweiterbar)
- **Styling**: Modulare CSS-Architektur

## 📊 Performance-Metriken

### Optimierungen
- **Bundle Size**: Minimale externe Abhängigkeiten
- **Loading Time**: < 2s initial load
- **Memory Usage**: Optimiert für große PDFs
- **Processing Speed**: Parallele Verarbeitung wo möglich

### Monitoring
- **Error Tracking**: Umfassende Fehlerprotokollierung
- **Performance**: Automatische Performance-Überwachung
- **User Analytics**: Anonymisierte Nutzungsstatistiken

## 🚀 Deployment

### Lokale Entwicklung
```bash
# Einfach die Dateien in einem Webserver bereitstellen
# Keine Build-Pipeline erforderlich
```

### Produktions-Deployment
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: Optimierte Ressourcen-Auslieferung
- **HTTPS**: Erforderlich für PWA-Features
- **Service Worker**: Automatische Registrierung

## 🔍 Fehlerbehebung

### Häufige Probleme
1. **PDF.js Fehler**: Seite neu laden
2. **Speicher-Fehler**: Kleinere Dateien verwenden
3. **Browser-Kompatibilität**: Neueste Browser-Version verwenden

### Debug-Modus
```javascript
// Entwickler-Konsole für Debug-Informationen
console.log('PDF Tools Debug Mode');
```

## 📈 Roadmap

### Geplante Features
- [ ] **Batch-Processing**: Mehrere PDFs gleichzeitig verarbeiten
- [ ] **Cloud-Integration**: Google Drive, Dropbox Support
- [ ] **OCR-Integration**: Text-Erkennung in PDFs
- [ ] **Komprimierung**: PDF-Größe optimieren
- [ ] **Passwort-Schutz**: Passwort-geschützte PDFs unterstützen

### Technische Verbesserungen
- [ ] **TypeScript**: Vollständige Typisierung
- [ ] **Unit Tests**: Umfassende Test-Suite
- [ ] **E2E Tests**: Automatisierte UI-Tests
- [ ] **Performance Monitoring**: Real-time Metriken

## 🤝 Beitragen

### Entwicklung
1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

### Bug Reports
- Detaillierte Fehlerbeschreibung
- Browser und Version
- Schritte zur Reproduktion
- Screenshots falls relevant

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei für Details.

## 🙏 Danksagungen

- **PDF-lib**: PDF-Manipulation
- **PDF.js**: PDF-Rendering
- **SortableJS**: Drag & Drop Funktionalität
- **Community**: Feedback und Verbesserungsvorschläge

---

**Entwickelt mit ❤️ für die beste PDF-Erfahrung**

