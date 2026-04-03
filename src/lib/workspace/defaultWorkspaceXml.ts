/** Default blocks shown after Reset — extend XML as you add new starter templates. */
export const DEFAULT_WORKSPACE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="ollie_start" x="48" y="48">
    <next>
      <block type="ollie_move_forward">
        <field name="STEPS">2</field>
        <next>
          <block type="ollie_turn">
            <field name="ANGLE">90</field>
            <next>
              <block type="ollie_play_sound">
                <field name="SOUND">pop</field>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
