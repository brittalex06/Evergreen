import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'node:fs';
const ai=new GoogleGenAI({apiKey:process.env.NETLIFY_AI_GATEWAY_KEY,httpOptions:{baseUrl:process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/,'')}});
try {
 const r=await ai.models.generateContent({model:'gemini-3.1-flash-image',contents:'Create a high-end lifestyle banking campaign photograph, panoramic 16:9 composition. A happy young multicultural couple, natural and candid, sitting on an oatmeal sofa in a beautiful warm modern apartment with house plants and morning light, using a silver laptop on their coffee table. They are in the middle and right of the image; left third is dark forest green interior in soft shadow with space for text. Muted warm film aesthetic, editorial photography, authentic expressions, linen clothes, no text, no logos, no graphics.',config:{responseModalities:['IMAGE']}});
 const p=r.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);
 if(p?.inlineData?.data){writeFileSync('public/img/evergreen-home.png',Buffer.from(p.inlineData.data,'base64')); console.log('Hero image saved.');} else console.log('No image returned.');
} catch {console.log('Image generation unavailable.');}
