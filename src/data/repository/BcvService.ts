import { storage } from '../../core/util/StorageService';

class BcvService {
  // Primario: DolarAPI (Basado en BCV)
  private apiUrl = 'https://ve.dolarapi.com/v1/dolares/bcv';

  async getLatestRate(): Promise<number> {
    try {
      const response = await fetch(this.apiUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('DolarAPI unreachable');
      const data = await response.json();
      return data.promedio || 36.00;
    } catch (error) {
      console.error('BCV Fetch Error:', error);
      // Fallback a otra fuente si falla la principal
      try {
        const fallResponse = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', { cache: 'no-store' });
        const fallData = await fallResponse.json();
        return fallData.monedas?.usd?.promedio || 36.00;
      } catch (e) {
        return 36.00;
      }
    }
  }
}

export const bcv = new BcvService();
