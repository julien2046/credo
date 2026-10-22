import { Routes, useOutletContext } from 'react-router';
import {
  renderStorefrontRoutes,
  type RenderStorefrontRoutesProps,
} from '@credo/feature';

export default function StorefrontDynamicRoute() {
  const context = useOutletContext<RenderStorefrontRoutesProps>();
  return <Routes>{renderStorefrontRoutes(context)}</Routes>;
}
