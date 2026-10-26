/** Owner-approved brand asset; labels and permissions remain separate from branding. */
export default function BrandLogo({width=96}:{width?:number}){
 return <img src={`${import.meta.env.BASE_URL}brand/mgtv-logo-gold-v1.png`} alt="MGTV" width={1782} height={883} draggable={false} decoding="async" style={{display:"block",width,height:width*883/1782,maxWidth:"100%",objectFit:"contain",flexShrink:0}} />;
}
