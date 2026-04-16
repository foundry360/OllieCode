/** Default blocks for the First Move / welcome starter — two Run stacks (costume loop + repeating greeting). */
export const DEFAULT_WORKSPACE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="ollie_start" x="48" y="48">
    <next>
      <block type="ollie_forever">
        <statement name="DO">
          <block type="ollie_next_costume">
            <next>
              <block type="ollie_wait">
                <field name="SECS">0.1</field>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </next>
  </block>
  <block type="ollie_start" x="48" y="320">
    <next>
      <block type="ollie_forever">
        <statement name="DO">
          <block type="ollie_say">
            <field name="TEXT">Hi friend!</field>
            <field name="SECS">5</field>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>`;
