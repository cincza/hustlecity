export function buildBlackjackPublicSession(session, handValue) {
  if (!session) return null;
  const concealed = session.stage === "player";
  const dealerCards = concealed ? (session.dealerCards || []).slice(0, 1) : (session.dealerCards || []);
  return {
    stage: session.stage,
    bet: session.bet,
    playerCards: session.playerCards || [],
    dealerCards,
    dealerHasHiddenCard: concealed && (session.dealerCards?.length || 0) > 1,
    message: session.message || "",
    playerValue: handValue(session.playerCards || []),
    dealerValue: concealed ? Number(dealerCards[0]?.value || 0) : handValue(dealerCards),
  };
}
