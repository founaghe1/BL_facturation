import React, { useState, useRef, useEffect } from "react";
import InvoiceList from "./pages/InvoiceList";
import DraftList from "./pages/DraftList";
import { supabase } from "./supabaseClient";
import { updateProductStockAndHistory } from "./utils/stock";
import { upsertDraft } from "./utils/drafts";
import Notification from "./components/Notification";
import ConfirmModal from "./components/ConfirmModal";
import styles from "./App.module.css";
import AnimatedBackground from "./components/AnimatedBackground";
import InvoiceHeader from "./components/InvoiceHeader";
import InvoiceTable from "./components/InvoiceTable";
import CreateInvoiceButton from "./components/CreateInvoiceButton";
import DownloadPDFButton from "./components/DownloadPDFButton";
import type { InvoiceLineData } from "./components/InvoiceLine";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const defaultLine = (): InvoiceLineData => ({ quantity: 0, description: "", unitPrice: 0, total: 0 });

function App() {
  const [client, setClient] = useState({ name: "", phone: "", address: "" });
  const [supplier, setSupplier] = useState({ name: "", phone: "", address: "" });
  // Date au format YYYY-MM-DD HH:MM:SS
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 19).replace('_', ' '));
  const [lines, setLines] = useState<InvoiceLineData[]>([defaultLine(), defaultLine(), defaultLine()]);
  const [redirect, setRedirect] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [notif, setNotif] = useState<{ type?: 'success'|'error'|'info', message: string } | null>(null);
  const [showConfirmDraft, setShowConfirmDraft] = useState(false);

  // auto-hide notification after 3s
  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 3000);
    return () => clearTimeout(t);
  }, [notif]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'CFA' | 'GNF'>('EUR');
  const pdfRef = useRef<HTMLDivElement>(null);

  // Affiche le symbole ou texte selon la devise
  const getCurrencySymbol = (cur: string) => {
    switch (cur) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'CFA': return 'CFA';
      case 'GNF': return 'GNF';
      default: return '';
    }
  };

  const handleClientChange = (field: string, value: string) => setClient(c => ({ ...c, [field]: value }));
  const handleSupplierChange = (field: string, value: string) => setSupplier(s => ({ ...s, [field]: value }));
  const handleDateChange = (value: string) => setDate(value);

  const handleLineChange = (idx: number, field: keyof InvoiceLineData, value: string | number) => {
    setLines(lines => {
      const newLines = [...lines];
      newLines[idx] = { ...newLines[idx], [field]: value };
      
      // Recalculer le total si quantity ou unitPrice change
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? Number(value) : newLines[idx].quantity;
        const unitPrice = field === 'unitPrice' ? Number(value) : newLines[idx].unitPrice;
        newLines[idx].total = quantity * unitPrice;
      }
      
      return newLines;
    });
  };

  const addLine = () => setLines(lines => [...lines, defaultLine()]);
  const removeLine = (idx: number) => setLines(lines => lines.filter((_, i) => i !== idx));

  const total = lines.reduce((sum, line) => sum + line.total, 0);

  const handleCreateInvoice = async () => {
    try {
      const invoiceLines = lines.filter(line => line.description && line.quantity > 0);
      
      // Vérifier le stock AVANT de créer la facture
  const stockResult: any = await updateProductStockAndHistory(invoiceLines, date);
  console.debug('stock check result', stockResult, 'invoiceLines:', invoiceLines);
      // Si le stock est insuffisant ou produit manquant, afficher notification et proposer brouillon
      if (stockResult && stockResult.success === false) {
        setNotif({ type: 'error', message: stockResult.message });
        // proposer placement en brouillon si insuffisant
        setShowConfirmDraft(true);
        return;
      }

      // Si le stock est suffisant, créer la facture
      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            client_name: client.name,
            client_phone: client.phone,
            client_address: client.address,
            supplier_name: supplier.name,
            supplier_phone: supplier.phone,
            supplier_address: supplier.address,
            date: date,
            total: total,
            currency: currency,
            lines: invoiceLines
          }
        ])
        .select();

      if (error) throw error;

      setRedirect(true);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Erreur lors de la création de la facture');
      
      // En cas d'erreur après la mise à jour du stock, vous pourriez vouloir restaurer le stock
      // Cette partie est optionnelle mais recommandée pour la cohérence des données
      console.warn("La facture n'a pas été créée mais le stock a peut-être été modifié");
    }
  };

  const handleSaveDraft = async (existingId?: number) => {
    try {
      const invoiceLines = lines.filter(line => line.description && line.quantity > 0);
      const draft = {
        id: existingId ?? currentDraftId,
        client_name: client.name,
        client_phone: client.phone,
        client_address: client.address,
        supplier_name: supplier.name,
        supplier_phone: supplier.phone,
        supplier_address: supplier.address,
        date: date,
        total: total,
        currency: currency,
        lines: invoiceLines,
      };

      const res = await upsertDraft(draft);
      console.debug('handleSaveDraft result', res);
      if (res && res.error) {
        console.error('Erreur Supabase lors de la sauvegarde du brouillon', res.error);
        setNotif({ type: 'error', message: 'Erreur lors de la sauvegarde du brouillon: ' + (res.error.message || JSON.stringify(res.error)) });
      } else {
        if (res && res.data && Array.isArray(res.data) && res.data[0] && res.data[0].id) {
          setCurrentDraftId(res.data[0].id);
        }
        setNotif({ type: 'success', message: 'Brouillon enregistré' });
      }
    } catch (err) {
      console.error('Erreur sauvegarde brouillon', err);
      alert('Erreur lors de la sauvegarde du brouillon');
    }
  };

  // Confirm modal handler (placer en brouillon quand stock insuffisant)
  const confirmPlaceDraft = async () => {
    setShowConfirmDraft(false);
    try {
      await handleSaveDraft();
    } catch (err) {
      console.error('Erreur lors du placement en brouillon', err);
      setNotif({ type: 'error', message: 'Erreur lors du placement en brouillon' });
    }
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`facture-${client.name || 'sans-nom'}-${date}.pdf`);
  };

  // Rendu conditionnel
  if (showList && !selectedInvoice) {
    return (
      <AnimatedBackground>
        {notif && <Notification type={notif.type as any} message={notif.message} onClose={() => setNotif(null)} />}
        {showConfirmDraft && <ConfirmModal message={"Stock insuffisant. Voulez-vous placer cette facture en brouillon ?"} onConfirm={confirmPlaceDraft} onCancel={() => setShowConfirmDraft(false)} />}
        <InvoiceList onSelectInvoice={inv => setSelectedInvoice(inv)} />
        <div className="flex justify-center mt-6">
          <button
            className="btn btn-outline btn-pink-500 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer"
            onClick={() => setShowList(false)}
          >
            Retour à la création
          </button>
        </div>
      </AnimatedBackground>
    );
  }

  // Afficher la liste des brouillons
  if (showDrafts && !selectedInvoice) {
    return (
      <AnimatedBackground>
        {notif && <Notification type={notif.type as any} message={notif.message} onClose={() => setNotif(null)} />}
        {showConfirmDraft && <ConfirmModal message={"Stock insuffisant. Voulez-vous placer cette facture en brouillon ?"} onConfirm={confirmPlaceDraft} onCancel={() => setShowConfirmDraft(false)} />}
        <DraftList onSelectDraft={d => {
          // Charger le brouillon dans l'éditeur
          setClient({ name: d.client_name || '', phone: d.client_phone || '', address: d.client_address || '' });
          setSupplier({ name: d.supplier_name || '', phone: d.supplier_phone || '', address: d.supplier_address || '' });
          setDate(d.date || new Date().toISOString().slice(0, 19).replace('_', ' '));
          setCurrency(d.currency || 'EUR');
          setLines((d.lines && Array.isArray(d.lines) ? d.lines : []).map((l: any) => ({
            description: l.description || '',
            quantity: l.quantity || 0,
            unitPrice: l.unitPrice || 0,
            total: l.total || 0,
            product_id: l.product_id
          })));
          // remember draft id so future saves update instead of insert
          setCurrentDraftId(d.id ?? null);
          setShowDrafts(false);
        }} />
        <div className="flex justify-center mt-6">
          <button className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" onClick={() => setShowDrafts(false)}>Retour à la création</button>
        </div>
      </AnimatedBackground>
    );
  }


  if (selectedInvoice) {
    // Affichage lecture seule de la facture sélectionnée avec le même rendu que la facture à télécharger
    return (
      <AnimatedBackground>
        {notif && <Notification type={notif.type as any} message={notif.message} onClose={() => setNotif(null)} />}
        {showConfirmDraft && <ConfirmModal message={"Stock insuffisant. Voulez-vous placer cette facture en brouillon ?"} onConfirm={confirmPlaceDraft} onCancel={() => setShowConfirmDraft(false)} />}
        <div className="flex flex-col items-center justify-center min-h-screen px-2 md:px-0">
          <div className="bg-white rounded-xl shadow-xl p-4 md:p-10 mt-10 md:mt-20 mb-2 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Facture #{selectedInvoice.id}</h2>
            {/* Version PDF avec styles inline */}
            <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif', color: '#000', padding: '1rem' }}>
              {/* Image de fond très transparente */}
              <img 
                src="/logo.png"
                alt="Logo watermark"
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: 'auto', opacity: 0.1, zIndex: 0 }}
              />
              {/* Contenu de la facture */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                  FACTURE
                </h1>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-5">
                  <div>
                    <h3 style={{ fontWeight: 'bold' }}>Fournisseur:</h3>
                    <p>{selectedInvoice.supplier_name}</p>
                    {selectedInvoice.supplier_phone && <p>{selectedInvoice.supplier_phone}</p>}
                    {selectedInvoice.supplier_address && <p>{selectedInvoice.supplier_address}</p>}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold' }}>Client:</h3>
                    <p>{selectedInvoice.client_name}</p>
                    {selectedInvoice.client_phone && <p>{selectedInvoice.client_phone}</p>}
                    {selectedInvoice.client_address && <p>{selectedInvoice.client_address}</p>}
                  </div>
                </div>
                <p style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleString()}
                </p>
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Quantité</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Prix Unitaire</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.lines || []).map((line: any, index: number) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{line.description}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{line.quantity}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }} className="whitespace-nowrap">{line.unitPrice} {getCurrencySymbol(selectedInvoice.currency)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }} className="whitespace-nowrap">{line.total} {getCurrencySymbol(selectedInvoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
                  Total: {selectedInvoice.total} {getCurrencySymbol(selectedInvoice.currency)}
                </div>
              </div>
            </div>
            
          </div>
            <div className="flex flex-col md:flex-row justify-center mt-6 gap-4">
              <button className="btn btn-outline btn-pink-500 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer" onClick={() => setSelectedInvoice(null)}>
                Retour à la liste
              </button>
              {/* <button className="btn btn-outline btn-indigo-500" onClick={() => setShowList(false)}>
                Retour à la création
              </button> */}
            </div>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  if (redirect) {
    return (
      <AnimatedBackground>
        {notif && <Notification type={notif.type as any} message={notif.message} onClose={() => setNotif(null)} />}
        {showConfirmDraft && <ConfirmModal message={"Stock insuffisant. Voulez-vous placer cette facture en brouillon ?"} onConfirm={confirmPlaceDraft} onCancel={() => setShowConfirmDraft(false)} />}
        <div className="flex flex-col items-center justify-center min-h-screen px-2 md:px-0">
          <div className="bg-white rounded-xl shadow-xl p-4 md:p-10 mt-10 md:mt-20 mb-2 ">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Facture créée !</h2>
            <p className="mb-6 text-gray-700">Vous pouvez maintenant visualiser ou télécharger la facture.</p>
            
            {/* Version PDF avec styles inline */}
            <div 
              ref={pdfRef}
              style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                padding: '1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                fontFamily: 'Arial, sans-serif',
                color: '#000000',
                position: 'relative',
                // overflow: 'scroll'
              }}
            >
              {/* Image de fond très transparente */}
              <img 
                src="/logo.png"
                alt="Logo watermark"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '70%',
                  height: 'auto',
                  opacity: 0.1,
                  zIndex: 0
                }}
              />
              
              {/* Contenu de la facture */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                  FACTURE
                </h1>
                
                <div style={{ display: 'flex', justifyContent:"space-between", gap: '1rem', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontWeight: 'bold' }}>Fournisseur:</h3>
                    <p>{supplier.name}</p>
                    <p>{supplier.phone}</p>
                    <p>{supplier.address}</p>
                  </div>
                  
                  <div>
                    <h3 style={{ fontWeight: 'bold' }}>Client:</h3>
                    <p>{client.name}</p>
                    <p>{client.phone}</p>
                    <p>{client.address}</p>
                  </div>
                </div>
                
                <p style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <strong>Date:</strong> {date}
                </p>
                
                <div style={{ overflowX:'visible' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Quantité</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Prix Unitaire</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.filter(line => line.description && line.quantity > 0).map((line, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ddd', whiteSpace:'nowrap', padding: '8px' }}>{line.description}</td>
                        <td style={{ border: '1px solid #ddd', whiteSpace:'nowrap', padding: '8px', textAlign: 'center' }}>{line.quantity}</td>
                        <td style={{ border: '1px solid #ddd', whiteSpace:'nowrap', padding: '8px', textAlign: 'right' }}>{line.unitPrice} {getCurrencySymbol(currency)}</td>
                        <td style={{ border: '1px solid #ddd', whiteSpace:'nowrap', padding: '8px', textAlign: 'right' }}>{line.total} {getCurrencySymbol(currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ textAlign: 'right', fontSize: '16px', paddingBottom:'5px', fontWeight: 'bold' }}>
                  Total: {total} {getCurrencySymbol(currency)}
                </div>
                <div>
                  <p>✅ Conditions de retour et d’échange :</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '5px', lineHeight: '1.4', fontSize: '12px', color: '#555', listStyleType: 'disc' }}>
                    <li>Toujours verifier vos articles chez le GP ou expediteur avant de quiter.</li>
                    <li>En cas d'erreur ou de defaut d'article, le signaler automatiquement lors des verifications.</li>
                    <li>Les retours sont acceptés dans un délai de 5 jours pour les articles expediés hors Sénégal suivant la date de reception.</li>
                    <li>Pour les achats à Dakar, vous avez 24h pour échanger, aucun remboursement n’est effectuer, uniquement échange ou avoir</li>
                    <li>Les articles doivent être dans leur état d'origine, non utilisés.</li>
                    <li>Les articles soldés ou en promotion ne sont pas éligibles aux retours ou aux échanges.</li>
                    <li>Veuillez conserver le reçu ou la preuve d'achat pour faciliter le processus de retour ou d'échange.</li>
                    <li>Les frais de retour sont à la charge du client, sauf en cas d'erreur de notre part (defaut de l'article ou erreur).</li>

                  </ul>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
                    Merci pour votre confiance et votre achat !
                  </div>
                </div>
                
              </div>
            </div>
            
            
          </div>
            <div className="flex flex-col items-center  justify-center gap-4 mt-6">
              <button 
                onClick={() => setRedirect(false)}
                className="btn btn-outline btn-pink-500 w-50 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer"
              >
                Retour à l'édition
              </button>
              <button 
                onClick={downloadPDF}
                className="btn btn-primary btn-pink-500 w-50 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer"
              >
                Télécharger PDF
              </button>
              <button 
                onClick={() => setShowList(true)}
                className="btn btn-outline btn-indigo-500 w-50 btn-pink-500 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer"
              >
                Voir toutes les factures
              </button>
            </div>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      {notif && <Notification type={notif.type as any} message={notif.message} onClose={() => setNotif(null)} />}
      {showConfirmDraft && <ConfirmModal message={"Stock insuffisant. Voulez-vous placer cette facture en brouillon ?"} onConfirm={confirmPlaceDraft} onCancel={() => setShowConfirmDraft(false)} />}
      <div className="max-w-full md:max-w-3xl mx-auto py-6 md:py-10 px-2 md:px-4">
        <InvoiceHeader 
          client={client}
          supplier={supplier}
          date={date}
          currency={currency}
          onClientChange={handleClientChange}
          onSupplierChange={handleSupplierChange}
          onDateChange={handleDateChange}
          onCurrencyChange={setCurrency}
        />
        
        <InvoiceTable 
          lines={lines}
          onLineChange={handleLineChange}
          onAddLine={addLine}
        />
        
        <div className="flex justify-end mt-4">
          <span className="text-lg font-bold text-green-600">
            Total : {total.toFixed()} {getCurrencySymbol(currency)}
          </span>
        </div>
        
        <div className="flex justify-center gap-4">
          <CreateInvoiceButton onClick={handleCreateInvoice} disabled={lines.length === 0} />
        </div>
        
        <div className="flex flex-col items-center justify-center gap-4 mt-6">
          <button
            className="btn btn-primary btn-pink-500 w-50 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 cursor-pointer py-2"
            onClick={() => handleSaveDraft()}
          >
            Placer au Brouillon
          </button>
          <button
            className="btn btn-outline btn-indigo-500 btn-pink-500 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer"
            onClick={() => setShowList(true)}
          >
            Voir toutes les factures
          </button>
          <button
            className="btn btn-primary btn-pink-500 w-50 transition hover:scale-105 bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md rounded-full px-4 py-2 cursor-pointer"
            onClick={() => setShowDrafts(true)}
          >
            Voir les brouillons
          </button>
        </div>
      </div>
    </AnimatedBackground>
  );
}

export default App;