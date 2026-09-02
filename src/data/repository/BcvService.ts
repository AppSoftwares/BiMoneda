import { storage } from '../../core/util/StorageService';

class BcvService {
  // Primario: DolarAPI (Basado en BCV)
  private apiUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';

  async getLatestRate(): Promise<number> {
    try {
      const response = await fetch(this.apiUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('DolarAPI unreachable');
      const data = await response.json();
      return data.promedio;
    } catch (error) {
      console.error('BCV Fetch Error:', error);
      // Fallback a otra fuente si falla la principal
      try {
        const fallResponse = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', { cache: 'no-store' });
        const fallData = await fallResponse.json();
        const fallRate = fallData.monedas?.usd?.promedio;
        if (fallRate) return fallRate;
        throw new Error('Fallback también sin datos');
      } catch (e) {
        console.error('BCV Fallback Error:', e);
        throw new Error('No se pudo obtener la tasa BCV de ninguna fuente');
      }
    }
  }
}

export const bcv = new BcvService();
