import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */ 
export class majiActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["majimonsters", "sheet", "actor"],
      template: "systems/majimonsters/templates/actor/actor-sheet.html",
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      width: 600,
      height: 602,
      tabs: [
        { navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" },
        { navSelector: ".features-tabs", contentSelector: ".features-body", initial: "first" },
        { navSelector: ".techniques-tabs", contentSelector: ".techniques-body", initial: "first" }
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/majimonsters/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;
    context.user = game.user;

    // Prepare character data and items.
    this._prepareItems(context);
    this._prepareCharacterData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();
    CONFIG.TinyMCE.menubar = "false";
    CONFIG.TinyMCE.toolbar_mode = "sliding";
    CONFIG.TinyMCE.toolbar_persist = "false";
    CONFIG.TinyMCE.toolbar = "save code removeformat | styleselect bullist | table"

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  _prepareCharacterData(context) {
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const optional_features = [];
    const drajules = [];
    const learned_techniques = [];
    const starting_techniques = [];
    const grade1_techniques = [];
    const grade2_techniques = [];
    const grade3_techniques = [];
    const grade4_techniques = [];
    const grade5_techniques = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'item') {
        gear.push(i);
      }
      else if (i.type === 'feature') {
        if (i.flags.world?.position == "optional") {
          optional_features.push(i);
        }
        else if (i.flags.world?.position == "learned") {
          features.push(i);
        }
        else {
          this.actor.items.get(i._id).setFlag("world", "position", "learned");
          features.push(i);
        }
      }
      else if (i.type === 'drajule') {
        drajules.push(i);
      }
      else if (i.type === 'technique') {
        if (i.flags.world?.position == "grade1") {
          grade1_techniques.push(i);
        }
        else if (i.flags.world?.position == "grade1") {
          grade1_techniques.push(i);
        }
        else if (i.flags.world?.position == "grade2") {
          grade2_techniques.push(i);
        }
        else if (i.flags.world?.position == "grade3") {
          grade3_techniques.push(i);
        }
        else if (i.flags.world?.position == "grade4") {
          grade4_techniques.push(i);
        }
        else if (i.flags.world?.position == "grade5") {
          grade5_techniques.push(i);
        }
        else if (i.flags.world?.position == "starting") {
          starting_techniques.push(i);
        }
        else if (i.flags.world?.position == "learned"){
          learned_techniques.push(i);
        }
        else {
          this.actor.items.get(i._id).setFlag("world", "position", "learned");
          learned_techniques.push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.optional_features = optional_features;
    context.drajules = drajules;
    context.learned_techniques = learned_techniques;
    context.starting_techniques = starting_techniques;
    context.grade1_techniques = grade1_techniques;
    context.grade2_techniques = grade2_techniques;
    context.grade3_techniques = grade3_techniques;
    context.grade4_techniques = grade4_techniques;
    context.grade5_techniques = grade5_techniques;
  }

  /** @override */
  _onSortItem(event, itemData) {
    const source = this.actor.items.get(itemData._id)

    if (source.data.type == "technique") {
      const positionTarget = event.target.closest("[data-side]");
      const new_position = positionTarget ? positionTarget.dataset.side : "learned";
      source.setFlag("world", "position", new_position); 
    }
    else if (source.data.type == "feature") {
      const positionTarget = event.target.closest("[data-side]");
      const new_position = positionTarget ? positionTarget.dataset.side : "learned";
      source.setFlag("world", "position", new_position); 
    }
    return super._onSortItem(event, itemData);
  }

  /** @override */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    //handle item sorting within the same actor
    const actor = this.actor;
    let sameActor = (data.actorId === actor.id) ||
      (actor.isToken && (data.tokenId === actor.token.id));
    if (sameActor) return this._onSortItem(event, itemData);

    //create the owned item
    const new_item = await this._onDropItemCreate(itemData);

    const source = this.actor.items.get(new_item[0].data._id)

    if (source.data.type == "technique") {
      const positionTarget = event.target.closest("[data-side]");
      const new_position = positionTarget ? positionTarget.dataset.side : "learned";
      source.setFlag("world", "position", new_position);
    }
    else if (source.data.type == "feature") {
      const positionTarget = event.target.closest("[data-side]");
      const new_position = positionTarget ? positionTarget.dataset.side : "learned";
      source.setFlag("world", "position", new_position);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      console.log(li)
      const item = this.actor.items.get(li.data("itemId"));
      if(item.data.type=="drajule") {
        item.sheet.render(true, {height: 260});
      }
      else {
        item.sheet.render(true);
      }
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    html.find('.show-activated-monsters').click(ev => {
      let message=`<div class="flex-spread item-list">`;
      for (const d of this.actor.items){
        if (d.data.type=="drajule"){
          if(d.data.data.activated){
            message += 
              `<section class="item drajule" data-item-id="`+d.data._id+`">
                <img src="`+d.data.img+`" title="`+d.data.name+`" class="activated"/>
                <div class="item-controls" style="margin: 0px">
                  <label class="item-control item-edit" title="Edit Drajule">`+d.data.name+`</label>
                </div>    
              </section>`
          }
        }
      }
      message += `</div>`;

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: message,
        sound: CONFIG.sounds.dice
      });
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Change Stats
    html.find('.bonus-health').change(ev => {
      const actual = this.actor.data.data.stats.health;

      if ($(ev.currentTarget).children()[0].checked) {
        this.actor.update({"data.stats.health": actual+1});
      } else {
        this.actor.update({"data.stats.health": actual-1});
      }
    });

    html.find('.bonus-strike').change(ev => {
      const actual = this.actor.data.data.stats.strike;

      if ($(ev.currentTarget).children()[0].checked) {
        this.actor.update({"data.stats.strike": actual+1});
      } else {
        this.actor.update({"data.stats.strike": actual-1});
      }
    });

    html.find('.bonus-protection').change(ev => {
      const actual = this.actor.data.data.stats.protection;

      if ($(ev.currentTarget).children()[0].checked) {
        this.actor.update({"data.stats.protection": actual+1});
      } else {
        this.actor.update({"data.stats.protection": actual-1});
      }
    });

    html.find('.bonus-magic').change(ev => {
      const actual = this.actor.data.data.stats.magic;

      if ($(ev.currentTarget).children()[0].checked) {
        this.actor.update({"data.stats.magic": actual+1});
      } else {
        this.actor.update({"data.stats.magic": actual-1});
      }
    });

    html.find('.bonus-discipline').change(ev => {
      const actual = this.actor.data.data.stats.discipline;

      if ($(ev.currentTarget).children()[0].checked) {
        this.actor.update({"data.stats.discipline": actual+1});
      } else {
        this.actor.update({"data.stats.discipline": actual-1});
      }
    });

    html.find('.bonus-speed').change(ev => {
      const actual = this.actor.data.data.stats.speed;

      if ($(ev.currentTarget).children()[0].checked) {
        this.actor.update({"data.stats.speed": actual+1});
      } else {
        this.actor.update({"data.stats.speed": actual-1});
      }
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;

    let itemData = {};

    if(type=="drajule"){
      itemData = {
        name: "Empty",
        type: type,
        data: data,
        img: "systems/majimonsters/img/drajule.png"
      };
    }
    else {
      itemData = {
        name: name,
        type: type,
        data: data
      };
    }
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls for initiative
    if (dataset.label=="initiative") {
      console.log("Rolling initiative")

      event.preventDefault();
      return this.actor.rollInitiative({createCombatants: true});
    }

    // Handle show attribute
    if (dataset.label=="attribute-roll") {
      const stat_name = (dataset.attribute).toUpperCase();
      const stat = eval("this.actor.data.data.stats."+dataset.attribute);
      
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: this.actor.data.name+" has "+stat_name+" = "+stat,
        sound: CONFIG.sounds.dice
      });
    }

    // Handle change xp
    if (dataset.label=="xp-change") {
      const old_xp = this.actor.data.data.states.xp.value;
      const xp_max = this.actor.data.data.states.xp.max;
      let new_xp = old_xp;
      let message = "";

      if (dataset.sign == "plus"){
        new_xp += 1;
        message = this.actor.data.name+" gains 1 XP "

        if (new_xp == xp_max) {
          message += `<div style="color:red;font-weight: bold";>[LEVEL UP]</div>`
        }
      }
      else {
        new_xp += -1;
        message = this.actor.data.name+" losses 1 XP "
      }

      this.actor.update({"data.states.xp.value": new_xp});

      //create message and hide it if private
      let msg = {
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: game.user.data.name+" distributes experience",
        content: message,
        sound: CONFIG.sounds.dice
      };
      if (game.settings.get('core', 'rollMode') != "publicroll") {
        msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
      }
      ChatMessage.create(msg);
    }

    // Handle change level
    if (dataset.label=="level-change") {
      const old_level = this.actor.data.data.states.level;
      let new_level = old_level;
      let new_hp = this.actor.data.data.hp.value;
      let level_up = false;
      let message = "";

      //calculate level
      if (dataset.sign == "plus"){
        new_level += 1;
        new_hp += this.actor.data.data.stats.health;
        message = `<div style="color:indigo;font-weight: bold";>`+
        (this.actor.data.name).toUpperCase()+
        ` LEVELS UP!</div>`;
        level_up=true;
      }
      else {
        new_level += -1;
        new_hp += -this.actor.data.data.stats.health;
        message = `<div style="color:red;";>`+
        this.actor.data.name+` losses 1 LEVEL! </div>`
      }

      //change attributes
      const grade = Math.ceil(new_level/4);
      const old_grade = this.actor.data.data.states.grade;
      const grit = this.actor.data.data.states.grit.max + grade - old_grade;
      
      const level_to_xp = {
        0: 0,     
        1: 3,     2: 7,     3: 12,    4: 17,    5: 23,
        6: 30,    7: 38,    8: 46,    9: 54,    10: 64,
        11: 75,   12: 86,   13: 98,   14: 101,  15: 115,      
        16: 129,  17: 144,  18: 160,  19: 177,  20: 177
      }

      const level_benefits = {
        2: [
          "new technique"
        ],
        3: [
          "attribute increase"
        ],
        4: [
          "new technique"
        ],
        5: [
          "new trait"
        ],
        6: [
          "new technique"
        ],
        7: [
          "attribute increase"
        ],
        8: [
          "new technique",
          "technique upgrade"
        ],
        9: [
          "new trait"
        ],
        10: [
          "new technique"
        ],
        11: [
          "attribute increase"
        ],
        12: [
          "new technique",
          "technique upgrade"
        ],
        13: [
          "new trait"
        ],
        14: [
          "new technique"
        ],
        15: [
          "attribute increase"
        ],
        16: [
          "new technique",
          "technique upgrade"
        ],
        17: [
          "new trait"
        ],
        18: [
          "new technique"
        ],
        19: [
          "attribute increase"
        ],
        20: [
          "new technique",
          "technique upgrade"
        ]
      }

      if (level_up){
        //call sheet
        let sheet="systems/majimonsters/templates/chat/level-up-dialog.html";

        //populate techniques
        const _grade = "grade"+grade;
        let techniques = this.actor.items
          .filter(i => i.type == "technique")
          .filter(i => i.getFlag("world","position")==_grade)
          .map(i => i.data);
        let learned = this.actor.items
          .filter(i => i.type == "technique")
          .filter(i => i.getFlag("world","position")=="learned")
          .map(i => i.data);

        //populate upgrades for techniques
        const upgrade_pack = await game.packs.get(
          "world.technique-upgrades"
          );
        await upgrade_pack.getIndex({
          fields: ["data.description"]
        });

        //populate optional traits
        const optional = this.actor.items
          .filter(i => i.type == "feature")
          .filter(i => i.getFlag("world","position")=="optional")
          .map(i => i.data)
          .map(d => {
            const parenthesis = d.name.match(/ *\([^)]*\) */g)[0];
            d.tgrade = parenthesis.match(/(\d+)/)[0];
            return d;
          });

        //populate class traits
        const class_pack = await game.packs.get(
          "world."+(this.actor.data.data.class).toLowerCase()+"-traits"
          );
        if (class_pack) {
          await class_pack.getIndex({
            fields: ["data.description"]
          });
        }

        //populate traits
        const trait_pack = await game.packs.get("world.traits");
        await trait_pack.getIndex({
          fields: ["data.description"]
        }); 

        //add data
        const dialogData = {
          level: new_level,
          benefits: level_benefits[new_level],
          actor: this.actor.data,
          grade: grade,
          techniques: techniques,
          optional: optional,
          class_traits: class_pack?.index,
          traits: trait_pack.index,
          upgrades: upgrade_pack.index,
          upgradable_techniques: learned
        };
        const html = await renderTemplate(sheet, dialogData);

        //configure dialog
        const dialogConfig = {
          title: "Benefit: level "+new_level,
          content: html,
          buttons: {
            normal: {
              label: "Level up",
              callback: async () => {
                const choosen_benefit = document.querySelector(".choosen-benefit.active").id;
                if (choosen_benefit == "new technique"){
                  const learned_id = document.querySelector(".technique.active").id;
                  const learned_technique = this.actor.items.get(learned_id);
                  const learned_position = learned_technique.getFlag("world", "position");

                  //already learned
                  if (learned_position == "learned") {
                    return ui.notifications.warn(learned_tecnique.data.name+" was already learned");
                  }

                  // learns normally and levels up
                  if (learned.length < 4) {
                    learned_technique.setFlag("world", "origen", learned_position);
                    learned_technique.setFlag("world", "position", "learned");

                    // updates
                    this.actor.update({"data.states.level": new_level});
                    this.actor.update({"data.states.grade": grade});
                    this.actor.update({"data.states.grit.max": grit});
                    this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                    this.actor.update({"data.states.xp.value": 
                      (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                      level_to_xp[new_level-1] : 
                      Math.max(
                        this.actor.data.data.states.xp.value,
                        level_to_xp[new_level-1]
                      ) });
                    this.actor.update({"data.hp.value": new_hp});
                    this.actor.update({"data.hp.max": 
                      20 + new_level*this.actor.data.data.stats.health});

                    //adding data to card
                    let contentdata = {
                      title: "Level up!",
                      text: this.actor.data.name+" is now <b>level "+new_level+
                        "</b> and learns <b>"+learned_technique.data.name+"</b>",
                      tags: [{
                        name: choosen_benefit
                      }],                  
                      roll: 0,
                      rolldices: []
                    }
                    
                    //calling html and show it
                    let content = await renderTemplate(
                      "systems/majimonsters/templates/chat/simple-card.html",
                      contentdata
                    );

                    //create message and hide it if private
                    let msg = {
                      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                      content: content,
                      sound: CONFIG.sounds.dice
                    };
                    if (game.settings.get('core', 'rollMode') != "publicroll") {
                      msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                    }
                    ChatMessage.create(msg);
                    return;
                  }

                  // replaces another technique
                  const replaceDialogData = {
                    level: new_level,
                    benefits: ["replace technique"],
                    actor: this.actor.data,
                    grade: grade,
                    techniques: learned
                  };
                  const html = await renderTemplate(sheet, replaceDialogData);

                  const replaceDialogConfig = {
                    title: "Replace this technique",
                    content: html,
                    buttons: {
                      normal: {
                        label: "Forget",
                        callback: async () => {
                          const replaced_id = document.querySelector(".technique.active").id;
                          const replaced_technique = this.actor.items.get(replaced_id);
                          const replaced_origen = replaced_technique.getFlag("world", "origen");

                          if (replaced_origen) {
                            replaced_technique.setFlag("world", "position", replaced_origen);
                          }
                          else {
                            replaced_technique.setFlag("world", "position", "starting");
                          }
                          learned_technique.setFlag("world", "origen", learned_position);
                          learned_technique.setFlag("world", "position", "learned");

                          // updates
                          this.actor.update({"data.states.level": new_level});
                          this.actor.update({"data.states.grade": grade});
                          this.actor.update({"data.states.grit.max": grit});
                          this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                          this.actor.update({"data.states.xp.value": 
                            (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                            level_to_xp[new_level-1] : 
                            Math.max(
                              this.actor.data.data.states.xp.value,
                              level_to_xp[new_level-1]
                            ) });
                          this.actor.update({"data.hp.value": new_hp});
                          this.actor.update({"data.hp.max": 
                            20 + new_level*this.actor.data.data.stats.health});

                          //adding data to card
                          let contentdata = {
                            title: "Level up!",
                            text: this.actor.data.name+" is now <b>level "+new_level+"</b><br/>"+
                              this.actor.data.name+" forgot <b>"+replaced_technique.data.name+
                              "</b> and learned <b>"+learned_technique.data.name+"</b>",
                            tags: [{
                              name: "replaced technique"
                            }],                  
                            roll: 0,
                            rolldices: []
                          }
                          
                          //calling html and show it
                          let content = await renderTemplate(
                            "systems/majimonsters/templates/chat/simple-card.html",
                            contentdata
                          );

                          //create message and hide it if private
                          let msg = {
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            content: content,
                            sound: CONFIG.sounds.dice
                          };
                          if (game.settings.get('core', 'rollMode') != "publicroll") {
                            msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                          }
                          ChatMessage.create(msg);
                        }
                      }
                    }
                  }

                  const replaceDialogOptions= {
                    width: 600,
                    top: 100,
                    left: 100
                  };

                  new Promise(resolve => {
                    let d = new Dialog(replaceDialogConfig, replaceDialogOptions);
                    return d.render(true);
                  });

                }
                else if (choosen_benefit == "attribute increase"){
                  const choosen_stat=document.querySelector(".stat.dark");
                  if (! choosen_stat) {
                    return ui.notifications.warn("No stat was choosen");
                  }
                  const choosen_name=choosen_stat.id;

                  if (choosen_stat.classList.contains("first")){
                    this.actor.update({[`data.upgrade.`+choosen_name+`.first`]: true})
                    await this.actor.update({[`data.stats.`+choosen_name]: this.actor.data.data.stats[choosen_name]+1})
                  }
                  else {
                    this.actor.update({[`data.upgrade.`+choosen_name+`.second`]: true})
                    await this.actor.update({[`data.stats.`+choosen_name]: this.actor.data.data.stats[choosen_name]+1})
                  }

                  // updates
                  this.actor.update({"data.states.level": new_level});
                  this.actor.update({"data.states.grade": grade});
                  this.actor.update({"data.states.grit.max": grit});
                  this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                  this.actor.update({"data.states.xp.value": 
                    (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                    level_to_xp[new_level-1] : 
                    Math.max(
                      this.actor.data.data.states.xp.value,
                      level_to_xp[new_level-1]
                    ) });
                  this.actor.update({"data.hp.value": new_hp});
                  this.actor.update({"data.hp.max": 
                    20 + new_level*this.actor.data.data.stats.health});

                  //adding data to card
                  let contentdata = {
                    title: "Level up!",
                    text: this.actor.data.name+" is now <b>level "+new_level+
                      "</b> and upgrades its <b>"+choosen_name+" stat</b>",
                    tags: [{
                      name: choosen_benefit
                    }],                  
                    roll: 0,
                    rolldices: []
                  }
                  
                  //calling html and show it
                  let content = await renderTemplate(
                    "systems/majimonsters/templates/chat/simple-card.html",
                    contentdata
                  );

                  //create message and hide it if private
                  let msg = {
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    content: content,
                    sound: CONFIG.sounds.dice
                  };
                  if (game.settings.get('core', 'rollMode') != "publicroll") {
                    msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                  }
                  ChatMessage.create(msg);
                  return;

                }
                else if (choosen_benefit == "new trait"){
                  const choosen_trait = document.querySelector(".trait.active");
                  const choosen_id = choosen_trait.id;

                  if (choosen_trait.classList.contains("optional")) {
                    const learned_trait = this.actor.items.get(choosen_id);
                    learned_trait.setFlag("world","position","learned");

                    // updates
                    this.actor.update({"data.states.level": new_level});
                    this.actor.update({"data.states.grade": grade});
                    this.actor.update({"data.states.grit.max": grit});
                    this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                    this.actor.update({"data.states.xp.value": 
                      (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                      level_to_xp[new_level-1] : 
                      Math.max(
                        this.actor.data.data.states.xp.value,
                        level_to_xp[new_level-1]
                      ) });
                    this.actor.update({"data.hp.value": new_hp});
                    this.actor.update({"data.hp.max": 
                      20 + new_level*this.actor.data.data.stats.health});

                    //adding data to card
                    let contentdata = {
                      title: "Level up!",
                      text: this.actor.data.name+" is now <b>level "+new_level+
                        "</b> and gets the <b>"+learned_trait.data.name+" trait</b>",
                      tags: [{
                        name: choosen_benefit
                      }],                  
                      roll: 0,
                      rolldices: []
                    }
                    
                    //calling html and assign data
                    let content = await renderTemplate(
                      "systems/majimonsters/templates/chat/simple-card.html",
                      contentdata
                    );

                    //create message and hide it if private
                    let msg = {
                      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                      content: content,
                      sound: CONFIG.sounds.dice
                    };
                    if (game.settings.get('core', 'rollMode') != "publicroll") {
                      msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                    }
                    ChatMessage.create(msg);
                    return;
                  }
                  else if (choosen_trait.classList.contains("class")) {
                    const learned_trait = class_pack.index.get(choosen_id);
                    await Item.create(learned_trait, {parent: this.actor});

                    // updates
                    this.actor.update({"data.states.level": new_level});
                    this.actor.update({"data.states.grade": grade});
                    this.actor.update({"data.states.grit.max": grit});
                    this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                    this.actor.update({"data.states.xp.value": 
                      (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                      level_to_xp[new_level-1] : 
                      Math.max(
                        this.actor.data.data.states.xp.value,
                        level_to_xp[new_level-1]
                      ) });
                    this.actor.update({"data.hp.value": new_hp});
                    this.actor.update({"data.hp.max": 
                      20 + new_level*this.actor.data.data.stats.health});

                    //adding data to card
                    let contentdata = {
                      title: "Level up!",
                      text: this.actor.data.name+" is now <b>level "+new_level+
                        "</b> and gets the <b>"+learned_trait.name+" trait</b>",
                      tags: [{
                        name: choosen_benefit
                      }],                  
                      roll: 0,
                      rolldices: []
                    }
                    
                    //calling html and assign data
                    let content = await renderTemplate(
                      "systems/majimonsters/templates/chat/simple-card.html",
                      contentdata
                    );

                    //create message and hide it if private
                    let msg = {
                      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                      content: content,
                      sound: CONFIG.sounds.dice
                    };
                    if (game.settings.get('core', 'rollMode') != "publicroll") {
                      msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                    }
                    ChatMessage.create(msg);
                    return;
                  }
                  else if (choosen_trait.classList.contains("general")) {
                    const learned_trait = trait_pack.index.get(choosen_id);
                    await Item.create(learned_trait, {parent: this.actor});

                    // updates
                    this.actor.update({"data.states.level": new_level});
                    this.actor.update({"data.states.grade": grade});
                    this.actor.update({"data.states.grit.max": grit});
                    this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                    this.actor.update({"data.states.xp.value": 
                      (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                      level_to_xp[new_level-1] : 
                      Math.max(
                        this.actor.data.data.states.xp.value,
                        level_to_xp[new_level-1]
                      ) });
                    this.actor.update({"data.hp.value": new_hp});
                    this.actor.update({"data.hp.max": 
                      20 + new_level*this.actor.data.data.stats.health});

                    //adding data to card
                    let contentdata = {
                      title: "Level up!",
                      text: this.actor.data.name+" is now <b>level "+new_level+
                        "</b> and gets the <b>"+learned_trait.name+" trait</b>",
                      tags: [{
                        name: choosen_benefit
                      }],                  
                      roll: 0,
                      rolldices: []
                    }
                    
                    //calling html and assign data
                    let content = await renderTemplate(
                      "systems/majimonsters/templates/chat/simple-card.html",
                      contentdata
                    );

                    //create message and hide it if private
                    let msg = {
                      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                      content: content,
                      sound: CONFIG.sounds.dice
                    };
                    if (game.settings.get('core', 'rollMode') != "publicroll") {
                      msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                    }
                    ChatMessage.create(msg);
                    return;
                  }
                  
                }
                else if (choosen_benefit == "technique upgrade"){
                  const upgrade_element = document.querySelector(".upgrade.active");
                  const upgrade_id = upgrade_element.id;
                  const upgradable_element = document.querySelector(".upgradable.active");
                  const upgradable_id = upgradable_element.id;

                  const upgradable_target = this.actor.items.get(upgradable_id);
                  const upgrade_target = upgrade_pack.index.get(upgrade_id);
                  const upgradable_description = upgradable_target.data.data.description;

                  const upgrade_split = upgradable_description.split("<h4><strong>");
                  if (upgrade_split.length < 2){
                    await upgradable_target.update({
                      "data.description":
                      upgradable_description+
                      "<h4><strong>["+(upgrade_target.name).toUpperCase()+"]</strong></h4>"+
                      upgrade_target.data.description
                    })
                  }
                  else {
                    const new_description = upgrade_split[0];
                    await upgradable_target.update({
                      "data.description":
                      new_description+
                      "<h4><strong>["+(upgrade_target.name).toUpperCase()+"]</strong></h4>"+
                      upgrade_target.data.description
                    })
                  }  

                  // updates
                  this.actor.update({"data.states.level": new_level});
                  this.actor.update({"data.states.grade": grade});
                  this.actor.update({"data.states.grit.max": grit});
                  this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                  this.actor.update({"data.states.xp.value": 
                    (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                    level_to_xp[new_level-1] : 
                    Math.max(
                      this.actor.data.data.states.xp.value,
                      level_to_xp[new_level-1]
                    ) });
                  this.actor.update({"data.hp.value": new_hp});
                  this.actor.update({"data.hp.max": 
                    20 + new_level*this.actor.data.data.stats.health});

                  //adding data to card
                  let contentdata = {
                    title: "Level up!",
                    text: this.actor.data.name+" is now <b>level "+new_level+
                      "</b> and the technique <b>"+upgradable_target.data.name+
                      "</b> gets the <b>"+upgrade_target.name+"</b>",
                    tags: [{
                      name: choosen_benefit
                    }],                  
                    roll: 0,
                    rolldices: []
                  }
                  
                  //calling html and assign data
                  let content = await renderTemplate(
                    "systems/majimonsters/templates/chat/simple-card.html",
                    contentdata
                  );

                  //create message and hide it if private
                  let msg = {
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    content: content,
                    sound: CONFIG.sounds.dice
                  };
                  if (game.settings.get('core', 'rollMode') != "publicroll") {
                    msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                  }
                  ChatMessage.create(msg);
                  return;
                }
              }
            },
            skip: {
              label: "Skip",
              callback: async () => {
                // updates
                this.actor.update({"data.states.level": new_level});
                this.actor.update({"data.states.grade": grade});
                this.actor.update({"data.states.grit.max": grit});
                this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
                this.actor.update({"data.states.xp.value": 
                  (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
                  level_to_xp[new_level-1] : 
                  Math.max(
                    this.actor.data.data.states.xp.value,
                    level_to_xp[new_level-1]
                  ) });
                this.actor.update({"data.hp.value": new_hp});
                this.actor.update({"data.hp.max": 
                  20 + new_level*this.actor.data.data.stats.health});

                //adding data to card
                let contentdata = {
                  title: "Level up!",
                  text: this.actor.data.name+" is now <b>level "+new_level+"</b>",
                  tags: [{
                    name: "no benefit"
                  }],                  
                  roll: 0,
                  rolldices: []
                }
                
                //calling html and show it
                let content = await renderTemplate(
                  "systems/majimonsters/templates/chat/simple-card.html",
                  contentdata
                );

                //create message and hide it if private
                let msg = {
                  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                  content: content,
                  sound: CONFIG.sounds.dice
                };
                if (game.settings.get('core', 'rollMode') != "publicroll") {
                  msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
                }
                ChatMessage.create(msg);
              }
            }
          }
        };

        const dialogOptions= {
          width: 600,
          top: 100,
          left: 100
        };

        new Promise(resolve => {
          let d = new Dialog(dialogConfig, dialogOptions);
          return d.render(true);
        });
      } else {
        // updates
        this.actor.update({"data.states.level": new_level});
        this.actor.update({"data.states.grade": grade});
        this.actor.update({"data.states.grit.max": grit});
        this.actor.update({"data.states.xp.max": level_to_xp[new_level]});
        this.actor.update({"data.states.xp.value": 
          (this.actor.data.data.states.xp.value == level_to_xp[new_level]) ?
          level_to_xp[new_level-1] : 
          Math.max(
            this.actor.data.data.states.xp.value,
            level_to_xp[new_level-1]
          ) });
        this.actor.update({"data.hp.value": new_hp});
        this.actor.update({"data.hp.max": 
          20 + new_level*this.actor.data.data.stats.health});

        //adding data to card
        let contentdata = {
          title: "Level down",
          text: this.actor.data.name+" is now <b>level "+new_level+"</b>",
          tags: [],                  
          roll: 0,
          rolldices: []
        }
        
        //calling html and show it
        let content = await renderTemplate(
          "systems/majimonsters/templates/chat/simple-card.html",
          contentdata
        );

        //create message and hide it if private
        let msg = {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: content,
          sound: CONFIG.sounds.dice
        };
        if (game.settings.get('core', 'rollMode') != "publicroll") {
          msg.whisper = game.users.filter(u => u.isGM).map(u => u.id);
        }
        ChatMessage.create(msg);
      }
    }


    // Handle show affinity
    if(dataset.label=="show-affinity"){
      let show="this.actor.data.data.elements.affinities."+dataset.type;
      const affinity_number = eval(show);

      if (affinity_number == 0) return;

      let damage_type="";
      const affinity_bonus = this.actor.data.data.states.grade *2;

      if (affinity_number == 1) {
        damage_type = "basic";
      } else if (affinity_number == 2) {
        damage_type = "earth"
      } else if (affinity_number == 3) {
        damage_type = "fire"
      } else if (affinity_number == 4) {
        damage_type = "fury"
      } else if (affinity_number == 5) {
        damage_type = "ice"
      } else if (affinity_number == 6) {
        damage_type = "lightning"
      } else if (affinity_number == 7) {
        damage_type = "mystic"
      } else if (affinity_number == 8) {
        damage_type = "verdant"
      } else if (affinity_number == 9) {
        damage_type = "water"
      } else if (affinity_number == 10) {
        damage_type = "wind"
      }

      damage_type = damage_type.toUpperCase();

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: this.actor.data.name+" has "+damage_type+
          ` AFFINITY <div style="color:indigo;font-weight:bold">[AFFINITY BONUS = `+
          affinity_bonus+`]</div>`,
        sound: CONFIG.sounds.dice
      });
    }

    // Show size
    if (dataset.label == "show-size") {
      const size_code = this.actor.data.data.size;

      let size_name = "MEDIUM";

      if (size_code == 0){
        size_name = "TINY";
      }
      else if (size_code == 1){
        size_name = "SMALL";
      }
      else if (size_code == 3){
        size_name = "LARGE";
      }
      else if (size_code == 4){
        size_name = "HUGE";
      }

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: this.actor.data.name+" has SIZE = "+size_name,
        sound: CONFIG.sounds.dice
      });
    }

    // Show Resist and Vul
    if (dataset.label=="show-resistvul"){
      let show = "this.actor.data.data.elements."+dataset.type;
      const result = eval(show);
      const type = (dataset.type).toUpperCase();

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: this.actor.data.name+" has "+type+" = "+result,
        sound: CONFIG.sounds.dice
      });
    }

    // Handle restore items
    if (dataset.label=="restore_items") {

      for (const i of this.actor.items){
        if (i.data.data.max !=0) {
          i.update({"data.quantity": i.data.data.max});
        }
      }

      this.actor.update({"data.hp.value": this.actor.data.data.hp.max});

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: this.actor.data.name+" has rested for at least 6 hours. Refreshes all his uses and recovers hp",
        sound: CONFIG.sounds.dice
      });
    }

    // Handle rest
    if (dataset.label=="rest") {
      this.actor.update({"data.hp.value": this.actor.data.data.hp.max});
      this.actor.update({"data.states.grit.value": this.actor.data.data.states.grit.max});
      
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        rollMode: game.settings.get('core', 'rollMode'),
        content: this.actor.data.name+" has rested for at least 6 hours. Recovers hp and grit points",
        sound: CONFIG.sounds.dice
      });
    }


    // Handle rolls for guile
    if (dataset.label=="guile") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills.guile.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills.guile.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Guile roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for perception
    if (dataset.label=="perception") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills.perception.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills.perception.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Perception roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for persuasion
    if (dataset.label=="persuasion") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills.persuasion.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills.persuasion.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Persuasion roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for wits
    if (dataset.label=="wits") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills.wits.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills.wits.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Wits roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for education
    if (dataset.label=="education") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills2.education.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills2.education.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Education roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for intuition
    if (dataset.label=="intuition") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills2.intuition.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills2.intuition.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Intuition roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for proficiency
    if (dataset.label=="proficiency") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills2.proficiency.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills2.proficiency.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Proficiency roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for survival
    if (dataset.label=="survival") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills2.survival.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills2.survival.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Survival roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for athletics
    if (dataset.label=="athletics") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills3.athletics.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills3.athletics.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Athletics roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for fortitude
    if (dataset.label=="fortitude") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills3.fortitude.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills3.fortitude.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Fortitude roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for strength
    if (dataset.label=="strength") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills3.strength.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills3.strength.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Strength roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for willpower
    if (dataset.label=="willpower") {
      let dataroll = "2d4"; 
      if(this.actor.data.data.skills3.willpower.g5){
        dataroll = "2d6";  
      }
      if(this.actor.data.data.skills3.willpower.g8){
        dataroll = "2d8";  
      } 
      let roll = new Roll(dataroll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Willpower roll",
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle rolls for grit
    if (dataset.label=="grit") {
      //call sheet and data
      let sheet="systems/majimonsters/templates/chat/grit-dialog.html";
      let dialogData = {
      };
      const html = await renderTemplate(sheet, dialogData);

      //configure dialog
      const dialogConfig = {
        title: "Grit uses",
        content: html,
        buttons: {
          // Button for normal rolls
          consume: {
            label: "Use",
            callback: async () => {
              const use = document.forms.grit.use.value;
              const change = document.forms.grit.change.value;
              const actor = this.actor.data;
              let spendgrit = false;

              //data for card
              let title = "";
              let text = "";
              let tags = [];
              let roll = 0;
              let rolldices = [];

              if (change == "spend") {
                spendgrit = true;
              }

              //change title and text depending on use
              if (actor.data.states.grit.value<=0 && spendgrit) {
                return ui.notifications.warn("Not enough Grit");
              }
              else if (use == "recover") {
                title = "Recover Hit Points action";
                const healing = actor.data.states.grade * actor.data.stats.health;
                
                if (actor.data.hp.value == actor.data.hp.max){
                  return ui.notifications.warn(actor.name+" is at full hp");
                }
                else {
                  text = actor.name+" recovers <b>"+healing+" hp</b>";
                }

                this.actor.update({"data.hp.value": 
                  Math.min(actor.data.hp.value+healing, actor.data.hp.max)
                });
              }
              else if (use == "brace") {
                title = "Brace for Impact action";
                const shield = actor.data.states.grade * 5;
                text = actor.name+" reduces <b>"+shield+" damage</b>";
              }
              else if (use == "resist") {
                title = "Resist binding ritual";
                text = actor.name+" resists a binding ritual";

                let rollDice = "1d6";
                //roll dice
                roll = new Roll(rollDice, actor.data.data);
                await roll.evaluate();
                for (const r of roll.terms) {
                  if (!r.isDeterministic) {
                    rolldices.push(r);
                  }
                }
              }

              //spend grit or not
              if (spendgrit) {
                this.actor.update({
                  "data.states.grit.value": actor.data.states.grit.value-1
                });
                tags.push({
                  name: "-1 grit"
                });
              } 
              else {
                tags.push({
                  name: "No Grit spent"
                });
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
          }
        }
      }

      //create dialog
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

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
