# Outils de développement

## Aperçu web de l'application

L'application cible Android, mais Expo Router permet un export web pratique pour
prévisualiser l'interface sans émulateur :

```bash
npx expo export --platform web --output-dir dist
node scripts/serve-web.mjs --dir dist
# → http://localhost:3000
```

Le serveur est volontairement minimal (fichiers statiques + repli sur `index.html`).

## Vidéos de démonstration

Les six clips de `assets/videos/` sont générés localement, sans source externe, afin que
le fil fonctionne hors ligne. Ils ont été produits avec **ffmpeg** (filtre `mandelbrot`
pour le visuel, `aevalsrc` pour une nappe sonore douce), puis compressés en H.264/AAC.

Commande type (Linux/macOS, ffmpeg installé) :

```bash
mkdir -p assets/videos
for i in 1 2 3 4 5 6; do
  seed=$((i * 7))
  ffmpeg -y \
    -f lavfi -i "mandelbrot=s=360x640:rate=24:maxiter=160:start_scale=1.8:end_scale=0.35:end_pts=5" \
    -f lavfi -i "aevalsrc=0.06*sin(220*2*PI*t)+0.045*sin(277.18*2*PI*t)+0.045*sin(329.63*2*PI*t):s=22050:d=5" \
    -t 5 \
    -vf "hue=H=0.$seed+0.06*t:s=1.3,vignette=PI/4.5,eq=brightness=-0.03:saturation=1.2" \
    -af "afade=t=in:st=0:d=0.6,afade=t=out:st=4.2:d=0.8" \
    -c:v libx264 -preset veryfast -crf 33 -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 64k -shortest "assets/videos/vibe-$i.mp4"
  ffmpeg -y -i "assets/videos/vibe-$i.mp4" -frames:v 1 -q:v 6 "assets/videos/vibe-$i-poster.jpg"
done
```

Chaque fichier pèse moins de 250 Ko ; l'ensemble du dossier reste sous 2 Mo, ce qui est
acceptable dans un dépôt Git. Pour une application réelle, ces clips seraient remplacés
par des vidéos hébergées (Supabase Storage ou CDN).

## Pourquoi des vidéos générées plutôt que des vidéos libres de droits téléchargées ?

- aucune dépendance à un service externe ni à une licence tierce ;
- poids maîtrisé et reproductibilité totale ;
- le fil, la lecture, la pause et le son sont testables **hors ligne**.
