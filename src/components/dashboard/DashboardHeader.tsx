interface DashboardHeaderProps {
  businessName?: string;
}

const DashboardHeader = ({ businessName = 'העסק שלך' }: DashboardHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        שלום, {businessName}! 👋
      </h1>
      <p className="text-muted-foreground">
        הנה סיכום הביצועים שלך
      </p>
    </div>
  );
};

export default DashboardHeader;
