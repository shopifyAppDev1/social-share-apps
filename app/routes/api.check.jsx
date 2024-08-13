
import { json  } from '@remix-run/react'
import { authenticate } from '../shopify.server';


export  const loader = async ({request}) =>{
    const {admin , session} = await authenticate.admin(request);
        const productData =   await admin.rest.resources.Product.find({
            session: session,
            id: 8579949920468,
          });

          console.log(productData)

          return json(productData);
}

