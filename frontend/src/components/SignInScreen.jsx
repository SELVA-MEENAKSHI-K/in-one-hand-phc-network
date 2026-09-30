import React, { useState } from 'react';
import { Activity, Pill, Building2, ClipboardCheck, ShieldCheck, ArrowRight, Languages } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ROLES = [
  {
    key: 'phc_staff',
    icon: Pill,
    title: 'PHC Staff',
    tamil: 'பணியாளர்',
    who: 'Pharmacist / Nurse',
    lands: 'Opens Medicine Check-In / Out',
    needsPhc: true
  },
  {
    key: 'phc_admin',
    icon: Building2,
    title: 'PHC Administrator',
    tamil: 'மைய நிர்வாகி',
    who: 'Chief Medical Officer',
    lands: 'Opens Network Dashboard',
    needsPhc: true
  },
  {
    key: 'district_officer',
    icon: ClipboardCheck,
    title: 'District Health Officer',
    tamil: 'மாவட்ட சுகாதார அலுவலர்',
    who: 'Approves transfers',
    lands: 'Opens Transfer Approvals',
    needsPhc: false
  },
  {
    key: 'platform_admin',
    icon: ShieldCheck,
    title: 'Platform Administrator',
    tamil: 'தள நிர்வாகி',
    who: 'Verifies new PHCs',
    lands: 'Opens Onboarding & Verification',
    needsPhc: false
  }
];

export const SignInScreen = () => {
  const { signIn, phcs, currentPhcId, getUserNameForRole, language, setLanguage } = useApp();
  const [selected, setSelected] = useState('phc_staff');
  const [phcId, setPhcId] = useState(currentPhcId);

  const role = ROLES.find((r) => r.key === selected);
  const activePhcs = phcs.filter((p) => p.status !== 'Pending Verification');

  return (
    <div className="signin-shell">
      <div className="signin-card">
        <div className="signin-top">
          <div className="signin-brand">
            <div className="signin-brand-icon"><Activity size={24} /></div>
            <div>
              <h1>In One Hand</h1>
              <span>ஒரு கையில் • Unified PHC Network</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-pill"
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          >
            <Languages size={14} />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>

        <h2 className="signin-title">Sign in to continue</h2>
        <p className="signin-sub">
          {language === 'ta' ? 'உங்கள் பணிப்பொறுப்பைத் தேர்ந்தெடுக்கவும்' : 'Choose your role. You will land on the screen you use most.'}
        </p>

        <div className="signin-roles">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.key}
                type="button"
                className={`signin-role ${selected === r.key ? 'active' : ''}`}
                onClick={() => setSelected(r.key)}
              >
                <div className="signin-role-icon"><Icon size={20} /></div>
                <div className="signin-role-text">
                  <strong>{language === 'ta' ? r.tamil : r.title}</strong>
                  <span>{r.who}</span>
                </div>
              </button>
            );
          })}
        </div>

        {role.needsPhc && (
          <label className="signin-field">
            <span>Your Primary Health Centre</span>
            <select value={phcId} onChange={(e) => setPhcId(e.target.value)}>
              {activePhcs.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.district})</option>
              ))}
            </select>
          </label>
        )}

        <div className="signin-summary">
          Signing in as <strong>{getUserNameForRole(selected)}</strong>. {role.lands}.
        </div>

        <button
          type="button"
          className="btn btn-primary signin-submit"
          onClick={() => signIn(selected, role.needsPhc ? phcId : undefined)}
        >
          Sign In <ArrowRight size={16} />
        </button>

        <p className="signin-note">Prototype build: demo data, no real credentials needed.</p>
      </div>
    </div>
  );
};
