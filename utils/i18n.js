const db = require('./database');

const translations = {
  en: {
    errors: {
      no_permission: "❌ You don't have permission to use this command!",
      cooldown:
        '⏱️ Please wait {time} seconds before using this command again.',
      missing_args: '❌ Missing required arguments!',
    },
    success: {
      command_executed: '✅ Command executed successfully!',
    },
  },
  es: {
    errors: {
      no_permission: '❌ ¡No tienes permiso para usar este comando!',
      cooldown:
        '⏱️ Por favor espera {time} segundos antes de usar este comando nuevamente.',
      missing_args: '❌ ¡Faltan argumentos requeridos!',
    },
    success: {
      command_executed: '✅ ¡Comando ejecutado exitosamente!',
    },
  },
  fr: {
    errors: {
      no_permission:
        "❌ Vous n'avez pas la permission d'utiliser cette commande!",
      cooldown:
        "⏱️ Veuillez attendre {time} secondes avant d'utiliser cette commande à nouveau.",
      missing_args: '❌ Arguments requis manquants!',
    },
    success: {
      command_executed: '✅ Commande exécutée avec succès!',
    },
  },
};

class I18n {
  getLanguage(guildId) {
    const settings = db.get('guild_settings', guildId) || {};
    return settings.language || 'en';
  }

  setLanguage(guildId, language) {
    if (!translations[language]) return false;
    const settings = db.get('guild_settings', guildId) || {};
    settings.language = language;
    db.set('guild_settings', guildId, settings);
    return true;
  }

  translate(guildId, key, replacements = {}) {
    const lang = this.getLanguage(guildId);
    const keys = key.split('.');
    let value = translations[lang];

    for (const k of keys) {
      if (value[k]) value = value[k];
      else return key;
    }

    if (typeof value === 'string') {
      for (const [placeholder, replacement] of Object.entries(replacements)) {
        value = value.replace(`{${placeholder}}`, replacement);
      }
    }

    return value;
  }

  getAvailableLanguages() {
    return Object.keys(translations);
  }
}

module.exports = new I18n();
