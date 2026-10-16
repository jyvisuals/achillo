window.__ln={pending:[],scheduled:[],listeners:{}};
export const LocalNotifications={
 checkPermissions:async()=>({display:'granted'}),requestPermissions:async()=>({display:'granted'}),
 getPending:async()=>({notifications:window.__ln.pending.slice()}),
 cancel:async({notifications})=>{const ids=notifications.map(n=>n.id);window.__ln.pending=window.__ln.pending.filter(n=>!ids.includes(n.id));},
 schedule:async({notifications})=>{window.__ln.pending=window.__ln.pending.concat(notifications);window.__ln.scheduled.push(notifications);},
 addListener:async(n,f)=>{window.__ln.listeners[n]=f;}};
