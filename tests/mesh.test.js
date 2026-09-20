import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConversation,decodeDisplayText} from '../dist/mesh.js';
import {readFileSync} from 'node:fs';
const sample=JSON.parse(readFileSync(new URL('../dist/example.json',import.meta.url),'utf8'));

test('imports envelopes, preserves body and raw fields, sorts timestamps',()=>{
  const data=structuredClone(sample);data.messages.reverse();const result=normalizeConversation(data);
  assert.equal(result.messages.length,4);assert.equal(result.messages[0].id,sample.messages[0].mid);assert.equal(result.messages[0].body,sample.messages[0].body);assert.deepEqual(result.messages[0].raw,sample.messages[0]);assert.equal(result.participants[1].represents,'Sam Rivera');
});
test('reads actual Fulcra record and nested MCP serialization',()=>{
  const body='hello\\n\\nworld \\u2014 <script>bad()</script>';const record={note:JSON.stringify({body,mid:'x',to_user:'b'}),recorded_at:'2026-09-20T19:36:00Z',metadata:{fulcra_userid:'a'}};
  const wrapper={structuredContent:{result:'Records for type from start to end: '+JSON.stringify([record])}};
  const result=normalizeConversation(wrapper);assert.equal(result.messages[0].from,'a');assert.equal(result.messages[0].body,body);assert.equal(result.messages[0].displayBody,'hello\n\nworld — <script>bad()</script>');assert.deepEqual(result.messages[0].raw,record);
});
test('unknown senders are not assigned to a known person',()=>{
  const r=normalizeConversation([{body:'Hello',to:'Somebody',direction:'out'}]);assert.equal(r.messages[0].from,'unknown');assert.equal(r.participants[0].represents,'');
});
test('infer the sender only from two explicit participants and a matching recipient',()=>{
  const r=normalizeConversation({participants:sample.participants,messages:[{body:'Hi',to_user:sample.participants[1].id}]});assert.equal(r.messages[0].from,sample.participants[0].id);
});
test('reject malformed records and timestamps with actionable errors',()=>{
  assert.throws(()=>normalizeConversation('{'),/Could not read JSON/);assert.throws(()=>normalizeConversation([{note:'{'}]),/Message 1/);assert.throws(()=>normalizeConversation([{body:42}]),/string body/);assert.throws(()=>normalizeConversation([{body:'test',time:'nope'}]),/invalid timestamp/);assert.throws(()=>normalizeConversation({participants:{},messages:[]}),/participants must/);
});
test('empty arrays and combined incoming/outgoing work',()=>{
  assert.equal(normalizeConversation([]).messages.length,0);assert.equal(normalizeConversation({incoming:[{body:'in'}],outgoing:[{body:'out'}]}).messages.length,2);assert.equal(decodeDisplayText('unchanged “text”'), 'unchanged “text”');
});
