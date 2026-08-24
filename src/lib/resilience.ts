export class TimeoutError extends Error{constructor(message='请求超时，请检查网络后重试'){super(message);this.name='TimeoutError'}}
export async function withTimeout<T>(task:Promise<T>,ms=10000,message?:string):Promise<T>{let timer:number|undefined;const timeout=new Promise<never>((_,reject)=>{timer=window.setTimeout(()=>reject(new TimeoutError(message)),ms)});try{return await Promise.race([task,timeout])}finally{clearTimeout(timer)}}
export async function retry<T>(run:()=>Promise<T>,attempts=2,delay=350):Promise<T>{let last:unknown;for(let i=0;i<attempts;i++){try{return await run()}catch(error){last=error;if(i<attempts-1)await new Promise(resolve=>setTimeout(resolve,delay*(i+1)))}}throw last}
export const safeStorage={
 get(key:string){try{return localStorage.getItem(key)}catch{return null}},
 set(key:string,value:string){try{localStorage.setItem(key,value);return true}catch{return false}},
 remove(key:string){try{localStorage.removeItem(key)}catch{return}}
}
export function friendlyError(error:unknown,fallback='操作失败，请稍后重试'){if(error instanceof TimeoutError)return error.message;if(error instanceof TypeError&&/fetch|network/i.test(error.message))return '网络连接不稳定，请检查网络后重试';if(error instanceof Error)return error.message||fallback;return fallback}
