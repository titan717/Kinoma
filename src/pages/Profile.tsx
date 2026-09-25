import React from 'react';
import { Link } from 'wouter';
import { UserRound, ArrowRight } from 'lucide-react';

export function Profile() {
  return (
    <main className="kinoma-simple-page">
      <div className="kinoma-simple-page__card">
        <div className="kinoma-simple-page__icon"><UserRound size={20} /></div>
        <span className="kinoma-eyebrow">PROFILE</span>
        <h1>Your Kinoma profile</h1>
        <p>Profiles and personalised recommendations are ready for the MovieApi-backed experience.</p>
        <Link href="/home" className="kinoma-simple-page__button">Back home <ArrowRight size={15} /></Link>
      </div>
    </main>
  );
}
