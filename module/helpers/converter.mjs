export function inputToJSON (text) {
  let reg;
  let result = "";

  let input = text;
  input = input.replace(/\r\n/g," ").replace(/[\r\n]/g," ");
  input = input.trim();
  input = input.replace(/ +/g," ");
  reg = / T[1-9] /g;
  result = reg.exec(input);
  name = input.slice(0, result.index);
  input = input.slice(reg.lastIndex);

  let action_type
  reg = /^Combat action /g
  result = reg.exec(input);
  if (result) {
    action_type = "0";
    input = input.slice(reg.lastIndex);
  }

  reg = /^Utility action /g
  result = reg.exec(input);
  if (result) {
    action_type = "1";
    input = input.slice(reg.lastIndex);
  }

  reg = /^Movement /g
  result = reg.exec(input);
  if (result) {
    action_type = "2";
    input = input.slice(reg.lastIndex);
  }

  reg = /^Response /g
  result = reg.exec(input);
  if (result) {
    action_type = "3";
    input = input.slice(reg.lastIndex);;
  }

  reg = / --- /g
  result = reg.exec(input);
  const tag = input.slice(reg.lastIndex);
  input = input.slice(0, result.index);

  reg = / /g
  result = reg.exec(tag);
  let element;
  if (result) {
    element = tag.slice(0, result.index);
  }
  else {
    element = tag;
  }

  let element_code
  if (element === "Basic") {
    element_code = "1";
  } else {
    if (element === "Earth") {
      element_code = "2";
    } else {
      if (element === "Fire") {
        element_code = "3";
      } else {
        if (element === "Fury") {
          element_code = "4";
        } else {
          if (element === "Ice") {
            element_code = "5";
          } else {
            if (element === "Lightning") {
              element_code = "6";
            } else {
              if (element === "Mystic") {
                element_code = "7";
              } else {
                if (element === "Verdant") {
                  element_code = "8";
                } else {
                  if (element === "Water") {
                    element_code = "9";
                  } else {
                    if (element === "Wind") {
                      element_code = "10";
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  reg = /^Attack: /g;
  result = reg.exec(input);
  const has_attack = result;

  let stat1, stat2, stat2_alt, stat1_code, stat2_code, stat2_alt_code = "0"
  if (has_attack) {
    input = input.slice(reg.lastIndex);
    
    reg = / vs. /g;
    result = reg.exec(input);
    stat1 = input.slice(0, result.index);
    input = input.slice(reg.lastIndex);

    if (stat1 === "Strike") {
      stat1_code = "1";
    } else {
      if (stat1 === "Magic") {
        stat1_code = "2";
      }
    }

    reg = / /g
    result = reg.exec(input);
    stat2 = input.slice(0, result.index);
    input = input.slice(reg.lastIndex);

    if (stat2 === "Protection") {
      stat2_code = "1";
    } else {
      if (stat2 === "Discipline") {
        stat2_code = "2";
      }
    }

    reg = /^or /g
    result = reg.exec(input) 
    if (result) {
      input = input.slice(reg.lastIndex);

      reg = / /g
      result = reg.exec(input);
      stat2_alt = input.slice(0, result.index);
      input = input.slice(reg.lastIndex);

      if (stat2_alt === "Protection") {
        stat2_alt_code = "1";
      } else {
        if (stat2_alt === "Discipline") {
          stat2_alt_code = "2";
        }
      }
    }   
  }

  let split_top = input.split(/(Target: )|(Area: )|(Running Start: )|(Charged Up: )|(Gaze: )|(Aura: )/g);
  split_top = split_top.filter(x => x!=undefined && x!='');
  let top_titles = [];
  let top_descriptions = [];

  if (split_top.length > 1) {
    for (let i = 0; i < split_top.length; i += 2) {
      top_titles.push(split_top[i]);
      top_descriptions.push(split_top[i + 1]);
    }
  
    const last_description = top_descriptions[top_descriptions.length - 1];
    reg = /.[A-Z]/g;
    result = reg.exec(last_description);
    top_descriptions[top_descriptions.length - 1] = last_description.slice(0, result.index);
    input = last_description.slice(result.index + 1);
  }

  let split_bottom = input.split(/(Trigger \(.\): )|(Maintain: )|(Empower: )|(Grit: )|(Critical: )|(Recoil: )/g);
  split_bottom = split_bottom.filter(x => x!=undefined && x!='');
  let bottom_titles = [];
  let bottom_descriptions = [];

  for (let x = 1; x < split_bottom.length; x += 2) {
    bottom_titles.push(split_bottom[x]);
    bottom_descriptions.push(split_bottom[x + 1]);
  }

  const tech_description = split_bottom[0];

  reg = /[0-9]d[0-9]+( \+ [A-Z][^ ]*)?/g;
  result = reg.exec(tech_description);
  const has_damage = result;

  let description_before, description_after, damage, damage_dice
  if (has_damage) {
    description_before = tech_description.slice(0, result.index);
    description_after = tech_description.slice(reg.lastIndex);
    damage = has_damage[0];

    reg = / \+ /g;
    const has_plus = reg.exec(damage)
    if (has_plus) {
      const partial_dice = damage.slice(0, has_plus.index);
      const stat = damage.slice(reg.lastIndex);
      damage_dice = partial_dice + "+@stats." + stat.toLowerCase();
    } else {
      damage_dice = damage;
    }
  } else {
    damage_dice = "";
  }

  let description = "";

  if (has_attack || top_titles.length > 0) {
    description += "<p>";
  }

  if (has_attack) {
    description += "<strong>Attack:</strong> " + stat1 + " vs. " + stat2;
  }

  if (stat2_alt_code != 0) {
    description += " or " + stat2_alt;
  }

  if (has_attack && top_titles.length > 0) {
    description += "<br />";
  }

  for (var x = 0; x < top_titles.length; x += 1) {
    description += "<strong>" + top_titles[x] + "</strong>" + top_descriptions[x];

    if (x !== top_titles.length - 1) {
      description += "<br />";
    }
  }

  if (has_attack || top_titles.length > 0) {
    description += "</p>\n";
  }

  if (has_damage) {
    description += "<p>" + description_before + "<strong>" + damage + "</strong>" + description_after + "</p>";
  } else {
    description += "<p>" + tech_description + "</p>";
  }

  for (var x = 0, _pj_a = bottom_titles.length; x < _pj_a; x += 1) {
    description += "<p><strong>" + bottom_titles[x] + "</strong>" + bottom_descriptions[x] + "</p>";
  }

  const tech = {
    "name": name,
    "type": "technique",
    "img": "systems/majimonsters/img/elem"+element_code+".png",
    "data": {
      "type": action_type,
      "element": element_code,
      "attack": {
        "stat1": stat1_code,
        "stat2": stat2_code,
        "stat2_alt": stat2_alt_code,
      },
      "description": description,
      "damageroll": damage_dice,
      "tags": tag
    }
  };

  return tech;
}
