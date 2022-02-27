/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class majiItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `${item.name}`;

    // Technique Roll
    if (item.type == "technique") {
      let data = item;
      data.actor_id = this.actor.data._id;

      let content = await renderTemplate(
        "systems/majimonsters/templates/chat/technique-card.html",
        data
      );

      let message = {
        speaker: speaker,
        content: content,
        sound: CONFIG.sounds.dice
      };
      if (rollMode != "publicroll") {
        message.whisper = game.users.filter(u => u.isGM).map(u => u.id);
      }
      ChatMessage.create(message);
    }
    //Feature Roll
    else if (item.type=="feature") {
      let content = await renderTemplate(
        "systems/majimonsters/templates/chat/feature-card.html",
        item
      );

      let message = {
        speaker: speaker,
        content: content,
        sound: CONFIG.sounds.dice
      };
      if (rollMode != "publicroll") {
        message.whisper = game.users.filter(u => u.isGM).map(u => u.id);
      }
      ChatMessage.create(message);
    }
    //Item Roll
    else if (item.type=="item") {
      let data = item;
      data.actor_id = this.actor.data._id;

      let content = await renderTemplate(
        "systems/majimonsters/templates/chat/item-card.html",
        data
      );

      let message = {
        speaker: speaker,
        content: content,
        sound: CONFIG.sounds.dice
      };
      if (rollMode != "publicroll") {
        message.whisper = game.users.filter(u => u.isGM).map(u => u.id);
      }
      ChatMessage.create(message);
    }
    //No Formula Roll
    else if (!this.data.data.formula) {
      let message = {
        speaker: speaker,
        content: content,
        sound: CONFIG.sounds.dice
      };
      if (rollMode != "publicroll") {
        message.whisper = game.users.filter(u => u.isGM).map(u => u.id);
      }
      ChatMessage.create(message);
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: "lol",
      });
      return roll;
    }
  }
}
