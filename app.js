/* Original SnowRock buyer brief builder. No dependencies or network calls. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sections = [
    { key:'task', short:'Task', title:'Start with one useful task.', intro:'Describe what your AI needs to do and how a person will judge its answer. A project name and task are the only required answers.', fields:[
      {key:'project',label:'Project name',required:true,max:120,placeholder:'A short name your team will recognize'},
      {key:'company',label:'Buyer company or team',max:160},
      {key:'owner',label:'Brief owner and reviewer',max:200,help:'Use a role or name. Contact details are optional.'},
      {key:'use',label:'Intended use',kind:'checks',options:['Training','Evaluation','Retrieval','Other'],help:'Training changes a model. Evaluation tests it. Retrieval supplies information when it answers.'},
      {key:'task',label:'What should the AI do?',kind:'textarea',required:true,placeholder:'Describe one business task and who uses the result.',max:2000},
      {key:'inputs',label:'What will the AI receive?',kind:'textarea',max:1800,help:'Describe the inputs. Don’t paste actual customer records.'},
      {key:'output',label:'What should a useful answer contain?',kind:'textarea',max:1800},
      {key:'excludedUses',label:'Excluded uses or further approvals',kind:'textarea',max:1200}
    ]},
    {key:'records',short:'Records',title:'Connect the records.',intro:'Define one complete example, then name the fields and links someone would need to understand it.',fields:[
      {key:'category',label:'Data category',kind:'select',options:['Customer support','Finance and accounting','Software project history','Other']},
      {key:'unit',label:'What counts as one complete example?',kind:'textarea',max:1400,help:'For example: one support ticket, its replies, the policy used and the recorded outcome.'},
      {key:'fields',kind:'repeater'},
      {key:'links',label:'Links, revisions and missing records',kind:'textarea',max:1800,help:'Explain how files join, how revisions stay identifiable and what a missing value means.'}
    ]},
    {key:'scope',short:'Scope',title:'Set the search boundaries.',intro:'State which companies, systems and periods matter. Include difficult and incomplete cases when the task needs them.',fields:[
      {key:'companies',label:'Industries, company types and source systems',kind:'textarea',max:1800},
      {key:'regions',label:'Geographies and languages',max:300},
      {key:'start',label:'Coverage starts',kind:'date',half:true},
      {key:'end',label:'Coverage ends',kind:'date',half:true},
      {key:'timezone',label:'Time zone and date definitions',max:300,help:'Separate the date a case happened from the date its files were exported.'},
      {key:'volume',label:'Minimum and preferred volume',max:400,help:'Use complete examples as the unit, rather than counting every reply or file as a new case.'},
      {key:'caseMix',label:'Case mix and known gaps',kind:'textarea',max:1400},
      {key:'updates',label:'One delivery or continuing updates?',max:500},
      {key:'exclusions',label:'Companies or data categories to exclude',kind:'textarea',max:1000}
    ]},
    {key:'rights',short:'Rights',title:'Name the permission questions.',intro:'Describe the use you want to request and who needs to approve it. An unanswered permission question can remain open for review.',fields:[
      {key:'authority',label:'Who can authorize access and a license?',max:500},
      {key:'permissions',label:'Proposed license scope',kind:'textarea',max:1800,help:'Include intended use, users, duration, geography, sharing and any redistribution.'},
      {key:'restricted',label:'Personal or confidential information to exclude or restrict',kind:'textarea',max:1400},
      {key:'thirdParty',label:'Third-party material and other restrictions to review',kind:'textarea',max:1400},
      {key:'access',label:'Sample recipients, storage, retention and deletion',kind:'textarea',max:1400},
      {key:'rightsOwner',label:'Permission reviewer and open questions',kind:'textarea',max:1200}
    ]},
    {key:'sample',short:'Sample',title:'Make the sample decision clear.',intro:'Choose a sample and measurable checks before anyone prepares a full delivery. Set thresholds that suit this task.',fields:[
      {key:'sampleSize',label:'Sample size',kind:'number',min:1,max:1000000000,half:true},
      {key:'reviewDate',label:'Review deadline',kind:'date',half:true},
      {key:'selection',label:'Who selects the sample, and how?',kind:'textarea',max:1400,help:'Explain how dates, case types and incomplete records enter the sample.'},
      {key:'checks',label:'Checks and acceptance thresholds',kind:'textarea',max:2200,help:'Name each check, how it is measured, its pass threshold and how missing records count. For percentages, define both numerator and denominator.'},
      {key:'taskTest',label:'How will the sample be tested on the AI task?',kind:'textarea',max:1400},
      {key:'decision',label:'Reviewer, next decision and stop conditions',kind:'textarea',max:1400,help:'Name who can accept, request changes, expand or stop, and any limits on revisions.'}
    ]},
    {key:'delivery',short:'Delivery',title:'Separate the work and its costs.',intro:'A license, data preparation and SnowRock’s service are separate decisions. Identify who pays each cost and what it includes.',fields:[
      {key:'format',label:'File formats, schema and secure transfer',kind:'textarea',max:1400},
      {key:'deliveryOwner',label:'Preparation, delivery and acceptance owners',kind:'textarea',max:1400,help:'Who extracts and checks the records, delivers them and accepts the files?'},
      {key:'schedule',label:'Delivery schedule and correction process',kind:'textarea',max:1200},
      {key:'service',label:'Requested SnowRock service',kind:'select',options:['A specific introduction','A commissioned company search','Scope discussion first']},
      {key:'deliverables',label:'Service deliverables and completion conditions',kind:'textarea',max:1800,help:'For a search, define research, qualification questions, reporting dates, boundaries and stop rules.'},
      {key:'licenseBudget',label:'Data-license budget, paid to the data owner',max:700,help:'State the currency, payer, range or limit and what it covers. Leave open if not agreed.'},
      {key:'preparationBudget',label:'Separate preparation and delivery budget',max:700,help:'Name the payer and provider. State any costs already included in the license price.'},
      {key:'serviceBudget',label:'Separate SnowRock service budget and fee terms',kind:'textarea',max:1400,help:'State who pays, fee calculation, payment trigger, timing and cancellation terms. This tool does not quote a fee.'},
      {key:'nextAction',label:'Next action, decision maker and open questions',kind:'textarea',max:1600}
    ]}
  ];
  let current = 0;
  let fieldSerial = 0;
  let fictional = false;
  let changed = false;
  let confirmation = null;
  const preview = $('preview-dialog');
  const confirmDialog = $('confirm-dialog');
  const form = $('brief-form');
  const fieldDefinitions = sections.flatMap(section => section.fields.filter(field => field.kind !== 'repeater').map(field => ({...field,section:section.key})));
  const idFor = key => 'brief-' + key;
  const create = (tag, className, text) => {const el = document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  function fieldElement(def, prefix='brief', value='') {
    const wrap=create('div','field');const id=prefix+'-'+def.key;
    if(def.half)wrap.classList.add('half-field');
    const label=create('label','',def.label);label.htmlFor=id;
    if(!def.required)label.append(create('span','optional','Optional'));
    wrap.append(label);
    let input;
    if(def.kind==='textarea'){input=create('textarea');input.rows=3;}
    else if(def.kind==='select'){input=create('select');input.append(new Option('Leave open',''));def.options.forEach(o=>input.append(new Option(o,o)));}
    else {input=create('input');input.type=def.kind==='date'?'date':def.kind==='number'?'number':'text';}
    input.id=id;input.name=def.key;input.value=value;input.autocomplete='off';
    if(def.required){input.required=true;input.setAttribute('aria-required','true');}
    if(def.max && def.kind!=='number')input.maxLength=def.max;
    if(def.kind==='number'){input.min=String(def.min);input.max=String(def.max);input.step='1';input.inputMode='numeric';}
    if(def.placeholder)input.placeholder=def.placeholder;
    const described=[];
    if(def.help){const help=create('p','field-help',def.help);help.id=id+'-help';described.push(help.id);wrap.append(input,help);}else wrap.append(input);
    const error=create('p','field-error');error.id=id+'-error';error.hidden=true;wrap.append(error);described.push(error.id);input.setAttribute('aria-describedby',described.join(' '));
    return wrap;
  }
  function makeChecks(def) {
    const fieldset=create('fieldset','check-group');fieldset.append(create('legend','',def.label+' (optional)'));
    const options=create('div','check-options');
    def.options.forEach((option,i)=>{const label=create('label');const input=create('input');input.type='checkbox';input.name=def.key;input.value=option;input.id=idFor(def.key)+'-'+i;label.append(input,document.createTextNode(option));options.append(label);});
    fieldset.append(options,create('p','field-help',def.help));return fieldset;
  }
  function addRecordField(values={}, focus=false) {
    const serial=++fieldSerial;const row=create('div','record-field');row.dataset.row=String(serial);
    const head=create('div','record-field-head');head.append(create('h3','','Field '+($('record-fields').children.length+1)));
    const remove=create('button','remove-field','Remove');remove.type='button';remove.setAttribute('aria-label','Remove field '+($('record-fields').children.length+1));head.append(remove);row.append(head);
    const grid=create('div','two-columns');
    [{key:'name',label:'Field name',max:100},{key:'meaning',label:'Meaning and type',max:500},{key:'requirement',label:'Required or preferred?',kind:'select',options:['Required','Preferred']},{key:'link',label:'Linking identifier or missing-value rule',max:700}].forEach(def=>grid.append(fieldElement(def,'record-'+serial,values[def.key]||'')));
    row.append(grid);$('record-fields').append(row);
    remove.addEventListener('click',()=>{row.remove();renumber();markChanged();$('add-field').focus();});
    renumber();if(focus)row.querySelector('input').focus();
  }
  function renumber(){const rows=[...$('record-fields').children];rows.forEach((row,i)=>{row.querySelector('h3').textContent='Field '+(i+1);row.querySelector('.remove-field').setAttribute('aria-label','Remove field '+(i+1));});$('add-field').disabled=rows.length>=20;$('field-limit').textContent=rows.length>=20?'20 fields added. Add any further requirements in the links and revisions answer.':'Add up to 20 fields. Empty rows are left out of your export.';}
  function build() {
    sections.forEach((section,index)=>{
      const li=create('li');const button=create('button','step-button');button.type='button';button.dataset.step=String(index);button.setAttribute('aria-controls','panel-'+section.key);button.append(create('span','',String(index+1).padStart(2,'0')),create('span','',section.short));button.addEventListener('click',()=>showSection(index,true));li.append(button);$('step-nav').append(li);
      const panel=create('section','form-panel');panel.id='panel-'+section.key;panel.setAttribute('aria-labelledby','title-'+section.key);const heading=create('h3','panel-title',section.title);heading.id='title-'+section.key;heading.tabIndex=-1;panel.append(heading,create('p','panel-intro',section.intro));
      let halfGrid=null;
      section.fields.forEach(def=>{
        if(def.kind==='repeater'){
          panel.append(create('p','field-label','Fields your buyer needs'));
          const rows=create('div','field-table');rows.id='record-fields';panel.append(rows);
          const add=create('button','button button-outline add-field','Add another field +');add.id='add-field';add.type='button';add.addEventListener('click',()=>{addRecordField({},true);markChanged();});panel.append(add);const help=create('p','field-help');help.id='field-limit';panel.append(help);return;
        }
        if(def.half){if(!halfGrid){halfGrid=create('div','two-columns');panel.append(halfGrid);}halfGrid.append(fieldElement(def));}
        else{halfGrid=null;panel.append(def.kind==='checks'?makeChecks(def):fieldElement(def));}
      });
      $('form-panels').append(panel);
    });
    addRecordField();showSection(0,false);
  }
  function showSection(index, focus) {
    current=index;
    sections.forEach((section,i)=>{$('panel-'+section.key).hidden=i!==current;const button=document.querySelector('[data-step="'+i+'"]');if(i===current)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    $('previous').disabled=current===0;$('step-position').textContent='Section '+(current+1)+' of '+sections.length;
    $('next').textContent=current===sections.length-1?'Preview & export ↗':'Next: '+sections[current+1].short+' →';
    if(focus)$('title-'+sections[current].key).focus({preventScroll:false});
  }
  function collect() {
    const values={};
    fieldDefinitions.forEach(def=>{values[def.key]=def.kind==='checks'?[...form.querySelectorAll('input[name="'+def.key+'"]:checked')].map(input=>input.value):$(idFor(def.key)).value.trim();});
    const fields=[...$('record-fields').children].map(row=>Object.fromEntries([...row.querySelectorAll('input,select')].map(input=>[input.name,input.value.trim()]))).filter(row=>Object.values(row).some(Boolean));
    return {schemaVersion:'1.0',title:'SnowRock Buyer Data Brief',fictionalExample:fictional,...Object.fromEntries(sections.map(section=>[section.key,Object.fromEntries(section.fields.map(def=>[def.key,def.kind==='repeater'?fields:values[def.key]]))])),notes:{unansweredFields:'Open',processing:'Created locally in the browser. Not sent to SnowRock.',commercialRole:'The buyer and data owner agree the license, price and direct delivery. SnowRock’s introduction or commissioned search fee is separate and agreed before work.'},links:{discussRequirements:'https://snowrock.com/contact-sales?topic=buyer',commissioningGuide:'https://snowrock.com/guides/commissioning-a-data-search',blankWorksheet:'https://snowrock.com/sourcing#buyer-data-brief'}};
  }
  const printable = value => Array.isArray(value)?(value.length?value.join(', '):'Open'):(value||'Open');
  function toText(data) {
    const lines=['SNOWROCK BUYER DATA BRIEF',data.task.project||'Untitled project',''];
    if(data.fictionalExample)lines.push('FICTIONAL EXAMPLE: records, quantities and budgets are invented.','');
    sections.forEach((section,index)=>{
      lines.push((index+1)+'. '+section.short.toUpperCase(),'');
      section.fields.forEach(def=>{
        if(def.kind==='repeater'){
          lines.push('Fields:');
          const fields=data.records.fields;
          if(!fields.length)lines.push('Open');
          fields.forEach((field,i)=>{lines.push('  '+(i+1)+'. '+printable(field.name),'     Meaning and type: '+printable(field.meaning),'     Required or preferred: '+printable(field.requirement),'     Linking identifier or missing-value rule: '+printable(field.link));});
          lines.push('');
        }else lines.push(def.label+':',printable(data[section.key][def.key]),'');
      });
    });
    lines.push('SNOWROCK’S ROLE',data.notes.commercialRole,'Completing this brief does not create an order, license or fee agreement.','','Discuss requirements: '+data.links.discussRequirements,'Commissioning guide: '+data.links.commissioningGuide,'Blank worksheet: '+data.links.blankWorksheet,'','Created locally. This brief has not been sent to SnowRock.');
    return lines.join('\n')+'\n';
  }
  function clearError(input){input.removeAttribute('aria-invalid');const error=$(input.id+'-error');if(error){error.hidden=true;error.textContent='';}}
  function validate(all) {
    const errors=[];fieldDefinitions.forEach(def=>{const input=$(idFor(def.key));if(!input)return;if(!all&&def.section!==sections[current].key)return;clearError(input);let message='';
      if(def.required&&!input.value.trim())message=def.key==='project'?'Give this project a name.':'Describe the task your AI should perform.';
      else if(input.validity.badInput||input.validity.rangeUnderflow||input.validity.rangeOverflow||input.validity.stepMismatch)message='Use a whole number from 1 to 1,000,000,000.';
      else if(input.value&&input.validity.typeMismatch)message='Check this answer.';
      if(message)errors.push({input,message,section:def.section});
    });
    if((all||sections[current].key==='scope')&&$('brief-start').value&&$('brief-end').value&&$('brief-end').value<$('brief-start').value)errors.push({input:$('brief-end'),message:'Use an end date on or after the start date.',section:'scope'});
    const summary=$('error-summary');summary.replaceChildren();summary.hidden=!errors.length;
    errors.forEach(({input,message})=>{input.setAttribute('aria-invalid','true');const el=$(input.id+'-error');el.textContent=message;el.hidden=false;});
    if(errors.length){summary.append(create('strong','','Check '+errors.length+(errors.length===1?' answer.':' answers.')));const list=create('ul');errors.forEach(({input,message,section})=>{const li=create('li');const link=create('a','',message);link.href='#'+input.id;link.addEventListener('click',event=>{event.preventDefault();showSection(sections.findIndex(item=>item.key===section),false);input.focus();});li.append(link);list.append(li);});summary.append(list);showSection(sections.findIndex(section=>section.key===errors[0].section),false);errors[0].input.focus();return false;}
    return true;
  }
  function markChanged(){changed=true;$('draft-state').textContent='In this tab only. Download a copy to keep it.';}
  function openPreview(){if(!validate(true))return;$('brief-preview').textContent=toText(collect());$('download-status').textContent='';preview.showModal();}
  function download(format) {
    const data=collect();const content=format==='json'?JSON.stringify(data,null,2)+'\n':toText(data);const blob=new Blob([content],{type:format==='json'?'application/json;charset=utf-8':'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);const anchor=create('a');const slug=data.task.project.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'buyer-data-brief';anchor.href=url;anchor.download='snowrock-'+slug+'.'+format;anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);$('download-status').textContent=format.toUpperCase()+' download requested. Your answers are still here.';
  }
  const example = {
    project:'Fictional support-resolution evaluation',company:'Example AI team (fictional)',owner:'Evaluation lead (fictional)',use:['Evaluation'],task:'Test whether an AI assistant can draft a correct refund response using the policy that applied when a support ticket was handled.',inputs:'The original customer question, replies available before the decision and the applicable refund policy. Later resolutions are withheld from model input.',output:'A proposed response, the policy version supporting it and a flag when the record does not support a decision.',excludedUses:'No model training or redistribution without a separate written license.',category:'Customer support',unit:'One ticket linked to its messages, policy version and recorded resolution. Unresolved and escalated tickets retain their recorded status.',links:'ticket_id joins messages to tickets. policy_version joins to the dated policy. A missing resolution means “not recorded”, not a successful case.',companies:'Fictional software companies using a support-ticket system; source systems to be identified.',regions:'English-language cases; geography open for discussion.',start:'2026-01-01',end:'2026-03-31',timezone:'UTC. Coverage uses ticket-opened date; export date recorded separately.',volume:'Fictional target: 2,000 complete cases; minimum subject to sample review.',caseMix:'Include routine, escalated, rejected, reopened and unresolved cases. Preserve actual status and flag missing replies.',updates:'One delivery for this fictional evaluation.',exclusions:'No medical, payment-card or identity-document records.',authority:'An authorized company representative, after internal legal and privacy review.',permissions:'Request internal evaluation by the buyer’s named team for six months; no redistribution. Final terms remain open.',restricted:'Remove direct personal identifiers and private credentials. Confirm how message text will be reviewed.',thirdParty:'Review attachments, customer terms and third-party policy material before sharing.',access:'Named reviewers only. Storage, access controls, retention and deletion to be agreed before sample transfer.',rightsOwner:'Buyer legal reviewer and company representative; evidence of authority remains open.',sampleSize:'50',reviewDate:'2026-11-06',selection:'Company selects a documented mix across all three months and case types. Include incomplete cases and report how they were selected.',checks:'Fictional starting thresholds for discussion: all 50 ticket identifiers must be unique; every included message must link to a ticket. Report missing policy versions as a count out of 50, then agree an acceptable threshold before proceeding.',taskTest:'Run the model on the original question and policy. Compare its answer with the held-out recorded outcome. A reviewer assesses unsupported answers separately.',decision:'Evaluation lead reviews the sample. Accept, request one revision or stop. Stop if permission cannot be established or key policy context is unavailable.',format:'UTF-8 JSON messages, CSV ticket table and dated policy files, with a field glossary. Secure transfer method to be agreed.',deliveryOwner:'Company prepares and checks the records. Buyer evaluation lead accepts the delivery. No transfer through this tool.',schedule:'Target date open. Provide a file list, row counts and correction process with delivery.',service:'Scope discussion first',deliverables:'Discuss whether a commissioned company search fits this fictional requirement. Company criteria, reporting and stop rules need written agreement.',licenseBudget:'Fictional planning limit: USD 20,000 paid by the buyer to a data owner, subject to scope and a separate license.',preparationBudget:'Fictional planning allowance: USD 2,000 paid by the buyer to the agreed preparation provider; check which costs are included in the license.',serviceBudget:'Open. SnowRock and the buyer would separately agree scope, fee, payment trigger, timing and cancellation before work.',nextAction:'Fictional evaluation lead reviews the task and acceptance checks, then discusses open permission and cost questions.'
  };
  const exampleFields=[{name:'ticket_id',meaning:'Text; unique identifier for one support case',requirement:'Required',link:'Links ticket, messages and resolution'},{name:'policy_version',meaning:'Text; policy identifier and version used at the time',requirement:'Required',link:'Joins the decision to its dated policy; absent values marked not recorded'}];
  function applyExample(){form.reset();fieldDefinitions.forEach(def=>{if(def.kind==='checks'){form.querySelectorAll('input[name="'+def.key+'"]').forEach(input=>{input.checked=(example[def.key]||[]).includes(input.value);});}else{$(idFor(def.key)).value=example[def.key]||'';clearError($(idFor(def.key)));}});$('record-fields').replaceChildren();exampleFields.forEach(value=>addRecordField(value));fictional=true;$('example-banner').hidden=false;$('error-summary').hidden=true;markChanged();showSection(0,true);}
  function clearBrief(){form.reset();fieldDefinitions.forEach(def=>{const input=$(idFor(def.key));if(input)clearError(input);});$('record-fields').replaceChildren();addRecordField();fictional=false;changed=false;$('example-banner').hidden=true;$('error-summary').hidden=true;$('draft-state').textContent='Start with the task. Fill in what you know.';showSection(0,true);}
  function hasAnswers(){return fieldDefinitions.some(def=>def.kind==='checks'?form.querySelector('input[name="'+def.key+'"]:checked'):$(idFor(def.key)).value.trim())||[...$('record-fields').querySelectorAll('input,select')].some(input=>input.value.trim());}
  function ask(kind){confirmation=kind;$('confirm-title').textContent=kind==='example'?'Use a fictional example?':'Clear this brief?';$('confirm-message').textContent=kind==='example'?(hasAnswers()?'This replaces your current answers with a clearly labeled fictional support-data brief. Download your current work first if you want to keep it.':'This fills the form with a fictional support-data request, including invented quantities and planning budgets. It does not describe available inventory.'):'This removes the answers in this tab. Download a copy first if you want to keep them.';$('confirm-action').textContent=kind==='example'?'Use fictional example':'Clear brief';confirmDialog.showModal();$('confirm-cancel').focus();}
  build();
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{if(event.target.matches('input,textarea,select')){markChanged();if(event.target.id)clearError(event.target);$('error-summary').hidden=true;}});
  form.addEventListener('change',markChanged);
  $('previous').addEventListener('click',()=>showSection(Math.max(0,current-1),true));
  $('next').addEventListener('click',()=>{if(current===sections.length-1)openPreview();else if(validate(false))showSection(current+1,true);});
  $('preview-top').addEventListener('click',openPreview);
  $('preview-close').addEventListener('click',()=>preview.close());$('edit-brief').addEventListener('click',()=>preview.close());
  $('download-txt').addEventListener('click',()=>download('txt'));$('download-json').addEventListener('click',()=>download('json'));
  $('example-open').addEventListener('click',()=>ask('example'));$('clear-open').addEventListener('click',()=>ask('clear'));
  $('confirm-cancel').addEventListener('click',()=>confirmDialog.close());$('confirm-action').addEventListener('click',()=>{const action=confirmation;confirmDialog.close();if(action==='example')applyExample();else if(action==='clear')clearBrief();});
  window.addEventListener('beforeunload',event=>{if(changed&&hasAnswers()){event.preventDefault();event.returnValue='';}});
})();
