// The adapter is independent of the UI so another app can reuse it.
export function decodeDisplayText(value) {
  return value.replace(/\\n/g, '\n').replace(/\\u([0-9a-fA-F]{4})/g, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/\\"/g, '"');
}

function unwrap(value, depth = 0) {
  if (depth > 12) throw new Error('JSON wrappers are nested too deeply.');
  if (typeof value === 'string') {
    try { return unwrap(JSON.parse(value), depth + 1); }
    catch (error) {
      const start = value.indexOf(': [');
      if (value.startsWith('Records for ') && start >= 0) return unwrap(JSON.parse(value.slice(start + 2)), depth + 1);
      throw new Error('Could not read JSON. Check quotes, brackets, and commas.');
    }
  }
  if (Array.isArray(value)) return value.flatMap(item => unwrap(item, depth + 1));
  if (!value || typeof value !== 'object') throw new Error('Use an array of messages or a conversation object.');
  if ('note' in value || 'body' in value) return [value];
  if (value.messages !== undefined) return unwrap(value.messages, depth + 1);
  if (value.records !== undefined) return unwrap(value.records, depth + 1);
  if (value.structuredContent?.result !== undefined) return unwrap(value.structuredContent.result, depth + 1);
  if (value.result !== undefined) return unwrap(value.result, depth + 1);
  if (Array.isArray(value.content)) return value.content.filter(x => x.type === 'text').flatMap(x => unwrap(x.text, depth + 1));
  if (value.incoming !== undefined || value.outgoing !== undefined) {
    return [...unwrap(value.outgoing ?? [], depth + 1).map(x => ({...x, direction: 'out'})), ...unwrap(value.incoming ?? [], depth + 1).map(x => ({...x, direction: 'in'}))];
  }
  throw new Error('No messages found. Use messages, records, incoming/outgoing, or an array.');
}

export function normalizeConversation(input) {
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { throw new Error('Could not read JSON. Check quotes, brackets, and commas.'); }
  }
  const participants = [];
  const byId = new Map();
  if (input?.participants !== undefined && !Array.isArray(input.participants)) throw new Error('participants must be an array.');
  for (const p of input?.participants ?? []) {
    if (!p || typeof p.id !== 'string' || !p.id.trim()) throw new Error('Each participant needs a nonempty string id.');
    if (byId.has(p.id)) throw new Error('Participant IDs must be unique.');
    const person = {id:p.id, name:typeof p.name === 'string' ? p.name : 'Unnamed agent', represents:typeof p.represents === 'string' ? p.represents : '', outbox:typeof p.outbox === 'string' ? p.outbox : ''};
    participants.push(person); byId.set(p.id,person);
  }
  const addUnknown = id => {
    if (!byId.has(id)) { const p={id,name:id==='unknown'?'Unknown sender':'Agent '+id.slice(0,6),represents:'',outbox:''};participants.push(p);byId.set(id,p); }
  };
  const rows=unwrap(input);
  if (rows.length > 2000) throw new Error('This demo supports up to 2,000 messages per exchange.');
  const messages=rows.map((row,index)=>{
    let envelope=row;
    if (row.note !== undefined) {
      try { envelope=typeof row.note === 'string' ? JSON.parse(row.note) : row.note; }
      catch { throw new Error(`Message ${index+1}: note must contain valid JSON.`); }
    }
    if (!envelope || typeof envelope.body !== 'string') throw new Error(`Message ${index+1}: a string body is required.`);
    const to=typeof envelope.to_user === 'string' ? envelope.to_user : '';
    // A record's owner is authoritative. A direction alone cannot identify a sender.
    let from=envelope.from_user ?? row.from_user ?? row.metadata?.fulcra_userid;
    if (!from && participants.length===2 && to && byId.has(to)) from=participants.find(p=>p.id!==to).id;
    if (typeof from !== 'string' || !from) from='unknown';
    addUnknown(from);
    if(to) addUnknown(to);
    const time=row.recorded_at ?? row.time ?? envelope.time ?? envelope.recorded_at ?? null;
    if(time !== null && (typeof time !== 'string' || !Number.isFinite(Date.parse(time)))) throw new Error(`Message ${index+1}: invalid timestamp.`);
    return {id:typeof envelope.mid==='string'?envelope.mid:row.id??`message-${index+1}`,from,to,toLabel:typeof envelope.to==='string'?envelope.to:'',time,body:envelope.body,displayBody:decodeDisplayText(envelope.body),slug:typeof envelope.slug==='string'?envelope.slug:'',kind:typeof envelope.kind==='string'?envelope.kind:'message',priority:typeof envelope.pri==='string'?envelope.pri:'',raw:row,sequence:index};
  });
  messages.sort((a,b)=>a.time&&b.time?Date.parse(a.time)-Date.parse(b.time)||a.sequence-b.sequence:a.time?-1:b.time?1:a.sequence-b.sequence);
  return {title:typeof input?.title==='string'?input.title:'The exchange',participants,messages};
}
