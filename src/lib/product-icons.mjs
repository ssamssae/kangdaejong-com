import catalog from '../../public/brand/products/catalog.json';
export function productIcon(id){
  const item=catalog.products.find(p=>p.id===id);
  if(!item)throw Error(`Unregistered product: ${id}`);
  if(!item.icon&&!item.exception)throw Error(`Missing approved icon: ${id}`);
  return {id,icon:item.icon,icon2x:item.icon2x};
}
