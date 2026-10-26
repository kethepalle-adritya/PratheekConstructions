import { useEffect, useState, type FormEvent } from 'react';
import { getAdminSiteSettings, saveAdminSiteSettings, type SiteSettingsWrite } from '../../lib/admin-queries';
import { useSiteSettingsStatus } from '../../components/SiteSettingsProvider';

const initial: SiteSettingsWrite = {
  id: 1, company_name: '', tagline: null, about_text: null, phones: [],
  whatsapp_number: null, email: null, office_hours: null, address: null,
  instagram_url: null, facebook_url: null, youtube_url: null, footer_disclaimer: null,
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettingsWrite>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { refresh } = useSiteSettingsStatus();

  useEffect(() => {
    getAdminSiteSettings().then((value) => { if (value) setForm(value); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  function field<K extends keyof SiteSettingsWrite>(key: K, value: SiteSettingsWrite[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      await saveAdminSiteSettings({ ...form, company_name: form.company_name.trim(),
        phones: (form.phones ?? []).map((phone) => phone.trim()).filter(Boolean) });
      await refresh(); setMessage('Settings saved.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save settings.'); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="admin-loading">Loading site settings…</p>;

  return <section className="admin-page">
    <header className="admin-page-header"><div><p className="eyebrow">SITE CONTENT</p><h1>Settings</h1><p>Manage the contact details and company information shown across the website.</p></div></header>
    <form className="admin-form" onSubmit={submit}>
      {error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status">{message}</p>}
      <label>Company name<input required value={form.company_name} onChange={(e) => field('company_name', e.target.value)} /></label>
      <label>Tagline<input value={form.tagline ?? ''} onChange={(e) => field('tagline', e.target.value || null)} /></label>
      <label>About text<textarea rows={5} value={form.about_text ?? ''} onChange={(e) => field('about_text', e.target.value || null)} /></label>
      <label>Phone numbers (one per line)<textarea rows={3} value={(form.phones ?? []).join('\n')} onChange={(e) => field('phones', e.target.value.split('\n'))} /></label>
      <label>WhatsApp number<input value={form.whatsapp_number ?? ''} onChange={(e) => field('whatsapp_number', e.target.value || null)} /></label>
      <label>Email<input type="email" value={form.email ?? ''} onChange={(e) => field('email', e.target.value || null)} /></label>
      <label>Office hours<input value={form.office_hours ?? ''} onChange={(e) => field('office_hours', e.target.value || null)} /></label>
      <label>Address<textarea rows={3} value={form.address ?? ''} onChange={(e) => field('address', e.target.value || null)} /></label>
      <label>Instagram URL<input type="url" value={form.instagram_url ?? ''} onChange={(e) => field('instagram_url', e.target.value || null)} /></label>
      <label>Facebook URL<input type="url" value={form.facebook_url ?? ''} onChange={(e) => field('facebook_url', e.target.value || null)} /></label>
      <label>YouTube URL<input type="url" value={form.youtube_url ?? ''} onChange={(e) => field('youtube_url', e.target.value || null)} /></label>
      <label>Footer disclaimer<textarea rows={3} value={form.footer_disclaimer ?? ''} onChange={(e) => field('footer_disclaimer', e.target.value || null)} /></label>
      <button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
    </form>
  </section>;
}
