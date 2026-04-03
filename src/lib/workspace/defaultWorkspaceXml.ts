/** Default blocks after Reset — Scratch-style starter chain. */
export const DEFAULT_WORKSPACE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="ollie_start" x="48" y="48">
    <next>
      <block type="ollie_move_forward">
        <field name="STEPS">10</field>
        <next>
          <block type="ollie_turn_right">
            <field name="ANGLE">15</field>
            <next>
              <block type="ollie_say">
                <field name="TEXT">Hello!</field>
                <field name="SECS">1</field>
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
    </next>
  </block>
</xml>`;
