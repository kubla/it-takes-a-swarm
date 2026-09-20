import {normalizeConversation} from './mesh.js';

const paths={network:'M4 7h5m6 10h5M9 7l6 10M9 17l6-10M2 4h5v5H2zM17 4h5v5h-5zM2 15h5v5H2zM17 15h5v5h-5z',braces:'M8 3H6v6l-3 3 3 3v6h2M16 3h2v6l3 3-3 3v6h-2',archive:'M4 8h16v12H4zM3 3h18v5H3zM9 12h6',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',fingerprint:'M8 10a4 4 0 0 1 8 0v4M5 12v-2a7 7 0 0 1 14 0v5M12 10v7l-2 4M8 14v3l-2 3M16 17l-1 4M3 15v2',calendar:'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 17h2',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',message:'M3 4h18v13H8l-5 4z',arrow:'M4 12h16M15 7l5 5-5 5',x:'M6 6l12 12M18 6 6 18',upload:'M12 16V3M7 8l5-5 5 5M4 15v6h16v-6'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]??paths.message);svg.append(path);return svg;}
document.querySelectorAll('[data-icon]').forEach(e=>e.replaceWith(icon(e.dataset.icon)));
const colors=['#bca4ff','#9cdecf','#e9c782','#a5c5ff'];
const $=id=>document.getElementById(id);
const text=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;};
function uid(value){
  const outbox=value.startsWith('MomentAnnotation/');
  const id=outbox?value.slice(17):value;
  const short=(outbox?'outbox ':'')+id.slice(0,6)+'…'+id.slice(-4);
  const b=text('button',short,'uid');b.type='button';
  b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Expand identifier '+value);
  b.addEventListener('click',()=>{const expanded=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(expanded));b.setAttribute('aria-label',(expanded?'Collapse identifier ':'Expand identifier ')+value);b.textContent=expanded?value:short;});
  return b;
}
function renderText(el,value){
  const re=/(?:MomentAnnotation\/)?[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}|https?:\/\/[^\s)]+/gi;let position=0;
  for(const match of value.matchAll(re)){el.append(document.createTextNode(value.slice(position,match.index)));if(/^https?:/i.test(match[0])){const a=text('a',match[0]);a.href=match[0];a.target='_blank';a.rel='noopener noreferrer';el.append(a);}else{el.append(uid(match[0]));}position=match.index+match[0].length;}el.append(document.createTextNode(value.slice(position)));
}
const date=(time,options)=>time?new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',...options}).format(new Date(time)):'Time not provided';

function render(conversation, source){
  renderJson(source);
  const agentIndex=new Map(conversation.participants.map((p,i)=>[p.id,{...p,index:i}]));
  const participants=$('participants');participants.replaceChildren();
  $('participant-count').textContent=String(conversation.participants.length);
  conversation.participants.forEach((p,i)=>{
    const card=document.createElement('li');card.className='participant';card.style.setProperty('--agent',colors[i%colors.length]);
    const initials=p.name.split(/\s+/).map(w=>w[0]).slice(0,2).join('');
    const avatar=text('span',initials,'participant-avatar');avatar.setAttribute('aria-hidden','true');
    const identity=document.createElement('div');identity.className='participant-identity';
    const name=text('div',p.name,'participant-name');name.append(text('span','Agent','agent-label'));identity.append(name);
    const representation=text('div','Representing ','representation');representation.append(text('span',p.represents||'Not specified','represented-person'));identity.append(representation);
    card.append(avatar,identity);participants.append(card);
  });
  $('message-count').textContent=`${conversation.messages.length} messages`;
  const timeline=$('timeline');timeline.replaceChildren();
  let lastDate='';
  for(const m of conversation.messages){
    const day=m.time?date(m.time,{month:'long',day:'numeric',year:'numeric'}):'Undated';
    if(day!==lastDate){const heading=text('h2',day+(m.time?' · New York time':''),'date-heading');timeline.append(heading);lastDate=day;}
    const sender=agentIndex.get(m.from);const recipient=agentIndex.get(m.to);
    const article=document.createElement('article');article.className='message';article.style.setProperty('--agent',colors[sender.index%colors.length]);
    const initials=sender.name.split(/\s+/).map(w=>w[0]).slice(0,2).join('');const mark=text('div',initials,'message-avatar');mark.setAttribute('aria-hidden','true');
    const main=document.createElement('div');const header=document.createElement('header');header.className='message-head';header.append(text('span',sender.name,'message-name'));
    const route=text('span','','message-route');route.append(icon('arrow'),document.createTextNode(recipient?.name||m.toLabel||'Recipient not provided'));header.append(route);
    const time=text('time',date(m.time,{hour:'numeric',minute:'2-digit'}),'message-time');if(m.time)time.dateTime=m.time;header.append(time);
    const content=document.createElement('div');content.className='message-content';const body=document.createElement('div');body.className='message-body';renderText(body,m.displayBody);
    const details=document.createElement('details');details.className='message-details';details.append(text('summary','Details'));const dl=document.createElement('dl');
    for(const [key,value] of [['Message',String(m.id)],['To (as recorded)',m.toLabel||m.to||'Not provided'],['Topic',m.slug||'Not provided'],['Priority',m.priority||'Not provided'],['Recorded',date(m.time,{dateStyle:'medium',timeStyle:'long'})]]){dl.append(text('dt',key));const dd=document.createElement('dd');renderText(dd,value);dl.append(dd);}details.append(dl);content.append(body,details);main.append(header,content);article.append(mark,main);timeline.append(article);
  }
  if(!conversation.messages.length)timeline.append(text('p','No messages in this exchange.','empty'));
}

function renderJson(value){
  const target=$('json-document');target.replaceChildren();
  const json=JSON.stringify(value,null,2);let end=0;
  const pattern=/("(?:\\.|[^"\\])*"\s*:?)|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi;
  for(const match of json.matchAll(pattern)){
    target.append(document.createTextNode(json.slice(end,match.index)));
    const kind=match[0].startsWith('"')?(match[0].endsWith(':')?'key':'string'):'literal';
    target.append(text('span',match[0],'json-'+kind));end=match.index+match[0].length;
  }
  target.append(document.createTextNode(json.slice(end)));
}
function setView(view){
  for(const name of ['messages','json']){
    const active=name===view;
    $(name+'-tab').setAttribute('aria-selected',String(active));
    $(name+'-tab').tabIndex=active?0:-1;
    $(name+'-panel').hidden=!active;
  }
}
for(const name of ['messages','json']){
  $(name+'-tab').addEventListener('click',()=>setView(name));
  $(name+'-tab').addEventListener('keydown',event=>{
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();const next=event.key==='Home'?'messages':event.key==='End'?'json':name==='messages'?'json':'messages';
      setView(next);$(next+'-tab').focus();
    }
  });
}

// Integration entry point: pass a conversation object or JSON string.
export function displayConversation(input){
  const conversation=normalizeConversation(input);
  render(conversation,typeof input==='string'?JSON.parse(input):input);
  return {messages:conversation.messages.length,participants:conversation.participants.length};
}

async function start(){try{let response=await fetch('./demo.private.json');if(!response.ok)response=await fetch('./example.json');if(!response.ok)throw new Error('Messages could not be loaded.');displayConversation(await response.json());}catch(e){$('timeline').append(text('p',e.message,'empty'));}}
await start();

// Optional agent-facing entry point uses the same integration interface.
if(document.modelContext?.registerTool){try{await document.modelContext.registerTool({name:'display_mesh_conversation',title:'Display a mesh conversation',description:'Replace the local demo view with the supplied conversation JSON. Does not send messages or upload data.',inputSchema:{type:'object',properties:{json:{type:'string'}},required:['json'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(typeof input?.json!=='string')throw new Error('json must be a string.');return displayConversation(input.json);}});}catch(error){console.warn('Optional mesh tool unavailable:',error.message);}}
