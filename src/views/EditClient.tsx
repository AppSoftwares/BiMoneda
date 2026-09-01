import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../components/BottomNav';

const EditClient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rif: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('*')
        .eq('id', id || '')
        .single();

      if (data) {
        setFormData({
          name: (data as any).name,
          rif: (data as any).rif,
          email: (data as any).email || '',
          phone: (data as any).phone || '',
          address: (data as any).address || '',
        });
      }
    };
    fetchClient();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await (supabase as any).from('clients').update({
        name: formData.name,
        rif: formData.rif.toUpperCase(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      }).eq('id', id || '');

      if (error) throw error;
      alert('¡Cliente actualizado con éxito!');
      navigate('/clients');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      const { error } = await (supabase as any).from('clients').delete().eq('id', id || '');
      if (error) throw error;
      alert('Cliente eliminado correctamente.');
      navigate('/clients');
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter pb-32">
      <header className="bg-white px-6 h-20 flex items-center justify-between shadow-level-1 sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 text-primary active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-xl font-bold text-primary tracking-tight">Editar Cliente</h1>
        </div>
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 p-2 active:scale-90 transition-transform"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
      </header>

      <main className="p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nombre / Razón Social</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky outline-none shadow-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">RIF</label>
              <input
                type="text"
                value={formData.rif}
                onChange={(e) => setFormData({...formData, rif: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky outline-none shadow-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Dirección</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky outline-none shadow-sm"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Teléfono</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky outline-none shadow-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white border border-outline-variant rounded-md px-5 py-4 text-sm text-primary focus:border-accent-sky outline-none shadow-sm"
                    />
                </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-md shadow-level-2 active:scale-[0.98] transition-all uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default EditClient;
