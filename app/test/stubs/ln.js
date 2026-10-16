window.__ln={pending:[],scheduled:[],listeners:{},types:null};
export const LocalNotifications={
 checkPermissions:async()=>({display:'granted'}),requestPermissions:async()=>({display:'granted'}),
 getPending:async()=>({notifications:window.__ln.pending.slice()}),
 cancel:async({notifications})=>{const ids=notifications.map(n=>n.id);window.__ln.pending=window.__ln.pending.filter(n=>!ids.includes(n.id));},
 schedule:async({notifications})=>{window.__ln.pending=window.__ln.pending.concat(notifications);window.__ln.scheduled.push(notifications);},
 registerActionTypes:async(o)=>{window.__ln.types=o.types;},
 addListener:async(n,f)=>{window.__ln.listeners[n]=f;}};
