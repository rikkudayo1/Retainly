import {
  Sidebar
} from "@/components/ui/sidebar"

import AppSideBarHeader from "./AppSideBarHeader"
import AppSidebarFooter from "./AppSidebarFooter"
import AppSideBarContent from "./AppSideBarContent"

const AppSideBar = () => {
  return (
    <Sidebar>
      <AppSideBarHeader />
      <AppSideBarContent />
      <AppSidebarFooter />
    </Sidebar>
  )
}

export default AppSideBar