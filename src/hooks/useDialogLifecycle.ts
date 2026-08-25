import { useEffect, useRef } from 'react'

let locks=0
let previousOverflow=''
const focusable='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
export function useDialogLifecycle<T extends HTMLElement>(onClose:()=>void,{escape=true,initialFocus=true}:{escape?:boolean;initialFocus?:boolean}={}){
 const ref=useRef<T>(null)
 const closeRef=useRef(onClose)
 useEffect(()=>{closeRef.current=onClose},[onClose])
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
  if(locks++===0){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}
  const frame=requestAnimationFrame(()=>{if(!initialFocus)return;const target=ref.current?.querySelector<HTMLElement>('[autofocus],input:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])');target?.focus()})
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'&&escape){event.preventDefault();closeRef.current();return}
   if(event.key!=='Tab'||!ref.current)return
   const items=[...ref.current.querySelectorAll<HTMLElement>(focusable)].filter(item=>item.offsetParent!==null)
   if(!items.length){event.preventDefault();ref.current.focus();return}
   const first=items[0],last=items.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  document.addEventListener('keydown',key)
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);if(--locks===0)document.body.style.overflow=previousOverflow;previous?.focus()}
 },[escape,initialFocus])
 return ref
}
