export async function joinWaitlist(values: {name:string;phone:string;email?:string;role?:string;wantToRent:string[];wantToList:string[]}) {
  const base=(import.meta.env.VITE_API_URL||'/api').replace(/\/$/,'');
  let response:Response;
  try{response=await fetch(base+'/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values),signal:AbortSignal.timeout(30000)});}
  catch{throw new Error('Cannot reach ServiceLoop. Please check your connection and try again.');}
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result){const message=result?.message;throw new Error(Array.isArray(message)?message.join('. '):message||'Your signup could not be saved. Please try again.');}
  return result;
}
