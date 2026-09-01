class BcvService {
  private apiUrl = 'https://ve.dolarapi.com/v1/dolares/bcv';

  async getLatestRate(): Promise<number> {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error('Error al obtener tasa BCV');
      const data = await response.json();
      // data.promedio contains the BCV rate
      return data.promedio || 36.00;
    } catch (error) {
      console.error('BCV Fetch Error:', error);
      return 36.00; // Fallback
    }
  }
}

export const bcv = new BcvService();
