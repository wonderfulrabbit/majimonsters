// Import document classes.
import { majiActor } from "./documents/actor.mjs";
import { majiItem } from "./documents/item.mjs";
// Import sheet classes.
import { majiActorSheet } from "./sheets/actor-sheet.mjs";
import { majiItemSheet } from "./sheets/item-sheet.mjs";
import { majiTechniqueSheet } from "./sheets/item-technique-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { MAJIMONSTERS } from "./helpers/config.mjs";
import { inputToJSON } from "./helpers/converter.mjs";


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.majimonsters = {
    majiActor,
    majiItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.MAJIMONSTERS = MAJIMONSTERS;

  CONFIG.statusEffects = [
    {
      id : "mark_1",
      label: "Bleeding",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/bleeding.png"
    },
    {
      id: "mark_2",
      label: "Blinded",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/blinded.png"
    },
    {
      id: "mark_3",
      label: "Burning",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/burning.png"
    },
    {
      id: "mark_4",
      label: "Confused",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/confused.png"
    },
    {
      id: "mark_5",
      label: "Disoriented",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/disoriented.png"
    },
    {
      id: "mark_6",
      label: "Debilitated",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/debilitated.png"
    },
    {
      id: "mark_7",
      label: "Frightened",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/frightened.png"
    },
    {
      id: "mark_8",
      label: "Frozen",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/frozen.png"
    },
    {
      id: "mark_9",
      label: "Poisoned",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/poisoned.png"
    },
    {
      id: "mark_10",
      label: "Sealed",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/sealed.png"
    },
    {
      id: "mark_11",
      label: "Sleeping",
      icon: "https://assets.forge-vtt.com/60e46c979046b02c8f06dfcf/Maji%20Monsters/system/sleeping.png"
    }
  ];

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6+@stats.speed",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = majiActor;
  CONFIG.Item.documentClass = majiItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  Actors.registerSheet("majimonsters", majiActorSheet, { makeDefault: true });
  
  Items.registerSheet("majimonsters", majiItemSheet, { 
    types: ["item","feature","drajule"],
    makeDefault: true 
  });

  Items.registerSheet("majimonsters", majiTechniqueSheet, { 
    types: ["technique"],
    makeDefault: true 
  });

  
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toUpperEach', function(str) {
  const words = str.split(" ");
  return words.map((word) =>{
    return word[0].toUpperCase() + word.substring(1)
  }). join(" ");
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});


Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifEqualorMore', function(arg1, arg2, options) {
  return (arg1 >= arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isNotEqual', function(x, y, options) {
    return (x != y) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('printQuantity', function(consumable, quantity, max) {
  let outStr = ""
  if (consumable || quantity != 1) {
    outStr = "("+quantity;
    if (max != 0) {
      outStr += "/" + max;
    }
    outStr += ")";

  }
  return outStr;
});

Handlebars.registerHelper('newGrade', function(level) {
  return Math.ceil(level/4);
});


Handlebars.registerHelper('printElement', function(str) {
  let element = ""
  if (str == 1) {
    element = "Basic";
  } else if (str == 2) {
    element = "Earth"
  } else if (str == 3) {
    element = "Fire"
  } else if (str == 4) {
    element = "Fury"
  } else if (str == 5) {
    element = "Ice"
  } else if (str == 6) {
    element = "Lightning"
  } else if (str == 7) {
    element = "Mystic"
  } else if (str == 8) {
    element = "Verdant"
  } else if (str == 9) {
    element = "Water"
  } else if (str == 10) {
    element = "Wind"
  }

  return element;
});

Handlebars.registerHelper('printActionType', function(str) {
  let actionType = ""
  if (str == 0) {
    actionType = "Combat Action";
  } else if (str == 1) {
    actionType = "Utility Action";
  } else if (str == 2) {
    actionType = "Movement Action";
  } else if (str == 3) {
    actionType = "Response";
  }

  return actionType;
});

Handlebars.registerHelper('ifTitle', function(arg1, options) {
    return (arg1 == "title") ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifSubtitle', function(arg1, options) {
    return (arg1 == "subtitle") ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifNot', function(arg1, options) {
    return (arg1 != "title" && arg1 != "subtitle") ? options.fn(this) : options.inverse(this);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.majimonsters.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "majimonsters.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

Hooks.on("renderChatLog", (app, html, data) => addChatListeners(html,data));

function addChatListeners(html, data) {
  html.on('click', 'button.rollattack', doRollAttack);
  html.on('click', 'button.rolldamage', doRollDamage);
  html.on('click', 'button.useitem', doUseItem);
}

async function doRollAttack(event){
  //basic constant
  const data = event.currentTarget.dataset;
  const actor = game.actors.get(data.actor);
  const item = actor.items.get(data.item);
  const speaker = ChatMessage.getSpeaker({ actor: actor });
  const rollMode = game.settings.get('core', 'rollMode');

  //call sheet and data
  let sheet="systems/majimonsters/templates/chat/attack-roll-dialog.html";
  let dialogData = {
    name: item.data.name
  };
  const html = await renderTemplate(sheet, dialogData);

  //configure dialog
  const dialogConfig = {
    title: "Attack Roll",
    content: html,
    buttons: {
      // Button for normal rolls
      normal: {
        label: "Roll",
        callback: async () => {
          const grit = document.getElementById("empower");
          let number_targets;
          let rollDice;
          let stat1;
          let stat2;
          let total_bonus;

          if (grit.checked) {
            rollDice = "2d8";
            number_targets = document.getElementById("number_targets").value;

            const new_grit = actor.data.data.states.grit.value-number_targets;
            if(new_grit >= 0) {
              actor.update({
                "data.states.grit.value": new_grit
              });
            }
            else {
              return ui.notifications.warn("Not enough Grit");
            }
          }
          else {
            rollDice = "2d6";
          }

          //evaluate stat1 vs stat2
          if (item.data.data.attack.stat1 == 1) {
            rollDice += "+"+actor.data.data.stats.strike+"[strike]";
            stat1 = "Strike";
          }
          else {
            rollDice += "+"+actor.data.data.stats.magic+"[magic]";
            stat1 = "Magic";
          }
          if (item.data.data.attack.stat2 == 1) {
            stat2 = "Protection";
          } else {
            stat2 = "Discipline";
          }

          //get bonus
          const checkbox_bonus = document.getElementById("plus1").checked 
            - document.getElementById("minus1").checked;
          const textbox_bonus = document.getElementById("bonus").value;
          if (checkbox_bonus != 0) {
            rollDice += "+"+checkbox_bonus;
          }
          if (textbox_bonus) {
            rollDice += "+"+textbox_bonus;
          }
          if (checkbox_bonus != 0 || textbox_bonus) {
            rollDice += "[bonus]";
          }

          //roll dice
          let roll = new Roll(rollDice, actor.data.data);
          await roll.evaluate();
          let rolldices = []
          for (const r of roll.terms) {
            if (!r.isDeterministic) {
              rolldices.push(r)
            }
          }

          //check if critical
          let critical = false;
          const critmin = document.getElementById("critmin").value;
          if (roll.terms[0].total >= critmin) {
            critical = true;
          }

          //adding data
          let contentdata = item;
          contentdata.empowered = grit.checked;
          contentdata.stat1 = stat1;
          contentdata.stat2 = stat2;
          contentdata.roll = roll;
          contentdata.rolldices = rolldices;
          contentdata.number_targets = number_targets;
          contentdata.critical = critical;
          
          let content = await renderTemplate(
            "systems/majimonsters/templates/chat/attack-roll-card.html",
            contentdata
          );

          ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content: content,
            flavor: game.user.data.name+" rolls "+item.data.name+" Attack",
            sound: CONFIG.sounds.dice
          });
        }
      }
    }
  };
  const dialogOptions= {
    width: 400,
    top: 200,
    left: 200
  };

  new Promise(resolve => {
    let d = new Dialog(dialogConfig, dialogOptions);
    return d.render(true);
  });
}

async function doRollDamage(event){
  //basic constant
  const data = event.currentTarget.dataset;
  const actor = game.actors.get(data.actor);
  const item = actor.items.get(data.item);
  const speaker = ChatMessage.getSpeaker({ actor: actor });
  const rollMode = game.settings.get('core', 'rollMode');

  //call sheet and data
  let sheet="systems/majimonsters/templates/chat/damage-roll-dialog.html";
  let dialogData = {
    name: item.data.name
  };
  const html = await renderTemplate(sheet, dialogData);

  //configure dialog
  const dialogConfig = {
    title: "Damage Roll",
    content: html,
    buttons: {
      // Button for normal rolls
      normal: {
        label: "Normal",
        callback: async () => {
          const grit = document.getElementById("empower");
          let number_targets;
          let rollDice;
          let total_bonus;

          //base roll
          rollDice = item.data.data.damageroll;

          let reg = /[^.]*$/g
          const result = reg.exec(rollDice);
          
          if (result) {
            const stat = result[0]
            if (stat=="brawn") {
              rollDice +="[brawn]";
            }
            else if (stat=="talent") {
              rollDice +="[talent]";
            }
          }

          //add affinity
          let has_affinity = false;
          for (const a in actor.data.data.elements.affinities) {
            const actor_aff = actor.data.data.elements.affinities[a];
            if (item.data.data.element==actor_aff) {
              has_affinity = true;
            }
          }
          if (has_affinity) {
            const affinity_bonus = actor.data.data.states.grade*2;
            rollDice += "+"+affinity_bonus+"[affinity]"
          }

          // add grit and change it
          if (grit.checked) {
            rollDice += "+"+actor.data.data.states.grade;
            rollDice += "d6[empower]";
            number_targets = document.getElementById("number_targets").value;

            const new_grit = actor.data.data.states.grit.value-number_targets;
            if(new_grit >= 0) {
              actor.update({
                "data.states.grit.value": new_grit
              });
            }
            else {
              return ui.notifications.warn("Not enough Grit");
            }
            
          }

          //get bonus
          const checkbox_bonus = document.getElementById("plus1").checked 
            - document.getElementById("minus1").checked;
          const textbox_bonus = document.getElementById("bonus").value;
          if (checkbox_bonus != 0) {
            rollDice += "+"+checkbox_bonus;
          }
          if (textbox_bonus) {
            rollDice += "+"+textbox_bonus;
          }
          if (checkbox_bonus != 0 || textbox_bonus) {
            rollDice += "[bonus]";
          }

          //roll dice
          let roll = new Roll(rollDice, actor.data.data);
          await roll.evaluate();
          let rolldices = []
          for (const r of roll.terms) {
            if (!r.isDeterministic) {
              rolldices.push(r)
            }
          }

          //adding data
          let contentdata = item;
          contentdata.affinity = item.data.data.element;
          contentdata.empowered = grit.checked;
          contentdata.roll = roll;
          contentdata.rolldices = rolldices;
          contentdata.number_targets = number_targets;
          contentdata.critical = false;
          
          let content = await renderTemplate(
            "systems/majimonsters/templates/chat/damage-roll-card.html",
            contentdata
          );

          ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content: content,
            flavor: game.user.data.name+" rolls "+item.data.name+" Damage",
            sound: CONFIG.sounds.dice
          });
        }
      },
      critical: {
        label: "Critical",
        callback: async () => {
          const grit = document.getElementById("empower");
          let number_targets;
          let rollDice;

          //duplicate dices
          let normalroll = new Roll(item.data.data.damageroll,actor.data.data);
          for (const r of normalroll.terms) {
            if (!r.isDeterministic) {
              r.number = r.number*2;
            }
          }
          rollDice = normalroll.formula;

          let reg = /[^.]*$/g
          const result = reg.exec(rollDice);
          
          if (result) {
            const stat = result[0]
            if (stat=="brawn") {
              rollDice +="[brawn]";
            }
            else if (stat=="talent") {
              rollDice +="[talent]";
            }
          }

          //add affinity
          let has_affinity = false;
          for (const a in actor.data.data.elements.affinities) {
            const actor_aff = actor.data.data.elements.affinities[a];
            if (item.data.data.element==actor_aff) {
              has_affinity = true;
            }
          }
          if (has_affinity) {
            const affinity_bonus = actor.data.data.states.grade*2;
            rollDice += "+"+affinity_bonus+"[affinity]"
          }

          //add grit bonus and spend grit
          if (grit.checked) {
            rollDice += "+"+(actor.data.data.states.grade);
            rollDice += "d6[empower]";
            number_targets = document.getElementById("number_targets").value;

            const new_grit = actor.data.data.states.grit.value-number_targets;
            if(new_grit >= 0) {
              actor.update({
                "data.states.grit.value": new_grit
              });
            }
            else {
              return ui.notifications.warn("Not enough Grit");
            }
            
          }

          //get bonus
          const checkbox_bonus = document.getElementById("plus1").checked 
            - document.getElementById("minus1").checked;
          const textbox_bonus = document.getElementById("bonus").value;
          if (checkbox_bonus != 0) {
            rollDice += "+"+checkbox_bonus;
          }
          if (textbox_bonus) {
            rollDice += "+"+textbox_bonus;
          }
          if (checkbox_bonus != 0 || textbox_bonus) {
            rollDice += "[bonus]";
          }

          //roll dice
          let roll = new Roll(rollDice, actor.data.data);
          await roll.evaluate();
          let rolldices = []
          for (const r of roll.terms) {
            if (!r.isDeterministic) {
              rolldices.push(r)
            }
          }

          //adding data
          let contentdata = item;
          contentdata.affinity = item.data.data.element;
          contentdata.empowered = grit.checked;
          contentdata.roll = roll;
          contentdata.rolldices = rolldices;
          contentdata.number_targets = number_targets;
          contentdata.critical = true;
          
          let content = await renderTemplate(
            "systems/majimonsters/templates/chat/damage-roll-card.html",
            contentdata
          );

          ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content: content,
            flavor: game.user.data.name+" rolls "+item.data.name+" Damage",
            sound: CONFIG.sounds.dice
          });
        }
      }
    }
  };
  const dialogOptions= {
    width: 400,
    top: 200,
    left: 200
  };

  new Promise(resolve => {
    let d = new Dialog(dialogConfig, dialogOptions);
    return d.render(true);
  });
}

async function doUseItem(event){
  const data = event.currentTarget.dataset;

  const actor = game.actors.get(data.actor);
  const item = actor.items.get(data.item);

  //data for card
  let title = item.data.name;
  let text = (item.data.data.quantity-1)+" uses remaining";
  let tags = [{
    name: "-1 use"
  }];
  let roll = 0;
  let rolldices = [];

  if (item.data.data.quantity > 0) {
    item.update({"data.quantity": item.data.data.quantity-1});
  }
  else {
    return ui.notifications.warn("Not enough uses");
  }

  //adding data to card
  let contentdata = {
    title: title,
    text: text,
    tags: tags,
    roll: roll,
    rolldices: rolldices
  }
  
  //calling html and show it
  let content = await renderTemplate(
    "systems/majimonsters/templates/chat/simple-card.html",
    contentdata
  );
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    content: content,
    sound: CONFIG.sounds.dice
  });
}

function insertImportMenuItem(cc, jq, opts) {
  if (!game.user.isGM) return;

  const buttons = jq.find('header .action-buttons').first();
  const importButton = $('<button class="type="submit">')
    .append(
      $('<i class="fas fa-file-import"></i>'),
      document.createTextNode(`Import technique`)
    );
  buttons.append(importButton);
  importButton.on('click', function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const options = { left: window.innerWidth - 620, top: this.offsetTop + 20 };

    new Promise(resolve => new ImportJSON(resolve, options).render(true))
  });
}

class ImportJSON extends FormApplication {
  resolve;
  constructor(resolve, options) {
    super(undefined, options);
    this.resolve = resolve;
  }

  get template() {
    return `systems/majimonsters/templates/chat/import-dialog.html`;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Import Technique",
      // resizable: true
    });
  }

  getData() {
    const data = super.getData();
  }

  _readFile(evt) {
    var files = evt.target.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
      this.close();
      this.resolve(event.target?.result);
    }
    reader.readAsText(file);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[type="submit"').get(0)?.addEventListener('click', async () => {
      let json = document.getElementById("json-code").value;
      const folder_name = "Techniques";

      try {
        json = inputToJSON(json);
      }
      catch (err) {
        console.error(err);
        return ui.notifications.error("JSON function: "+err);
      }

      try {
        const folder_filter = game.folders.filter(f => {
          return f.data.name == folder_name
        });

        if (folder_filter){
          json.folder = folder_filter[0].data._id
        }
      }
      catch (err) {
        return ui.notifications.error(err);
      }

      try {
        const new_item = await Item.create(json);
        new_item.sheet.render(true);
      }
      catch (err) {
        return console.error(err);
      }
    });
  }

  async _updateObject(event, formData) {
    // normal updateObject stuff

    this.render(); // rerenders the FormApp with the new data.
  }
}

Hooks.on('renderItemDirectory', insertImportMenuItem);

