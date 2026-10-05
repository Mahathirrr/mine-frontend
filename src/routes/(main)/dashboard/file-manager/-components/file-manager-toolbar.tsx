import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

type Props = {
  search?: string;
  onSearchChange?: (value: string) => void;
  filter?: "all" | "starred";
  onFilterChange?: (value: "all" | "starred") => void;
  sort?: "modified" | "name" | "size";
  onSortChange?: (value: "modified" | "name" | "size") => void;
};

export function FileManagerToolbar({
  search = "",
  onSearchChange,
  filter = "all",
  onFilterChange,
  sort = "modified",
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <InputGroup className="md:max-w-lg">
        <InputGroupInput
          placeholder="Cari dokumen..."
          aria-label="Cari dokumen"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <SlidersHorizontal data-icon="inline-start" />
            Filter & sort
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tampilkan</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={(value) => onFilterChange?.(value as "all" | "starred")}
              >
                <DropdownMenuRadioItem value="all">Semua file</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred">Starred</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown />
                  Urutkan
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(value) => onSortChange?.(value as "modified" | "name" | "size")}
                    >
                      <DropdownMenuRadioItem value="modified">Terakhir diubah</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">Nama</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="size">Ukuran file</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
