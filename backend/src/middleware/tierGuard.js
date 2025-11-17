exports.premiumOnly = (req, res, next) => {
  if (req.user?.tier?.plan !== 'premium') {
    return res.status(403).json({
      error: 'Premium feature',
      message: 'This feature is available for Premium users only'
    });
  }
  next();
};

exports.checkListingLimit = async (req, res, next) => {
  const user = req.user;
  if (user.tier.plan === 'free' && user.tier.usage.currentListings >= user.tier.limits.activeListings) {
    return res.status(403).json({
      error: 'Limit reached',
      message: `Free tier allows ${user.tier.limits.activeListings} active listings`,
      upgrade: '/pricing'
    });
  }
  next();
};