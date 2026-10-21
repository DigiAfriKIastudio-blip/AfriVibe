/**
 * Délais maximaux du démarrage et des opérations d'E/S.
 *
 * Règle : **aucune opération asynchrone du démarrage ne doit pouvoir bloquer
 * l'application indéfiniment**. Chaque étape possède donc une borne de temps,
 * et le total est lui aussi borné (voir `STARTUP_BUDGET`).
 *
 * Ces valeurs sont volontairement généreuses : sur un appareil lent,
 * AsyncStorage peut mettre plusieurs secondes à répondre au premier accès.
 */

export const STARTUP_TIMEOUTS = {
  /** Lecture de la base locale (AsyncStorage). */
  databaseRead: 5000,
  /** Écriture de la base locale. */
  databaseWrite: 8000,
  /** Chargement d'une section de données (profil, fil, interactions…). */
  section: 6000,
  /** Plafond global de l'hydratation du store. */
  hydration: 9000,
  /** Masquage de secours du splash natif si l'écran de démarrage ne répond pas. */
  splashSafety: 4000,
  /** Affichage de l'écran « démarrage anormalement long ». */
  startupWatchdog: 12000,
} as const;

/** Budget maximal théorique du démarrage (borne de sécurité affichée dans les logs). */
export const STARTUP_BUDGET =
  STARTUP_TIMEOUTS.databaseRead + STARTUP_TIMEOUTS.hydration + STARTUP_TIMEOUTS.startupWatchdog;

/** Délais maximaux des opérations de publication vidéo (copie locale). */
export const PUBLISH_TIMEOUTS = {
  /** Copie du fichier choisi vers le stockage de l'application. */
  fileCopy: 20000,
  /** Préparation d'une vidéo de démonstration embarquée. */
  demoDownload: 20000,
} as const;
