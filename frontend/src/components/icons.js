import {
    Home, AlertTriangle, HardDrive, History, Users, Settings, User, ShieldCheck, Power, ChevronRight,
    QrCode, Rss, FileText, Clock, BarChart, LineChart, Phone, MessageSquare, Webhook, Play,
    RefreshCw, BellRing, Check
  } from 'lucide-react';
  
  export const iconMap = {
    Home,
    Incidents: AlertTriangle,
    Devices: HardDrive,
    History,
    Contacts: Users,
    Policies: Settings,
    users: User,
    gear: Settings,
    default: AlertTriangle
  };
  
  export function getIcon(iconName) {
    const IconComponent = iconMap[iconName] || iconMap.default;
    return <IconComponent className="w-5 h-5" />;
  }
  