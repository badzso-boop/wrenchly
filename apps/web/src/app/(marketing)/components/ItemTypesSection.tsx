import React from 'react';

export interface ItemType {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

const DEFAULT_ITEM_TYPES: ItemType[] = [
  { id: '1', name: 'Car', description: 'Automobiles, sedans, SUVs, and trucks' },
  { id: '2', name: 'Motorcycle', description: 'Motorbikes, scooters, and mopeds' },
  { id: '3', name: 'Bicycle', description: 'Road, mountain, and e-bikes' },
  { id: '4', name: 'Lawn Mower', description: 'Riding and push lawn mowers' },
  { id: '5', name: 'Generator', description: 'Portable and standby power generators' },
  { id: '6', name: 'Power Tool', description: 'Drills, saws, sanders, and equipment' },
  { id: '7', name: 'HVAC Unit', description: 'Air conditioners and heating systems' },
  { id: '8', name: 'Home Appliance', description: 'Washing machines, dryers, and fridges' },
  { id: '9', name: 'Boat Engine', description: 'Outboard and inboard marine engines' },
  { id: '10', name: 'Agricultural Equipment', description: 'Tractors, tillers, and harvesters' },
  { id: '11', name: 'Commercial Equipment', description: 'Industrial machinery and tools' },
  { id: '12', name: 'Electronics', description: 'Computers, AV equipment, and gadgets' },
];

export interface ItemTypesSectionProps {
  itemTypes?: ItemType[];
  title?: string;
  subtitle?: string;
  customCardTitle?: string;
  customCardDescription?: string;
}

export function ItemTypesSection({
  itemTypes = DEFAULT_ITEM_TYPES,
  title = 'Supported Item Types',
  subtitle = 'We support a wide variety of equipment and machinery for maintenance and repair tracking.',
  customCardTitle = 'Custom Item Types',
  customCardDescription = 'Need to track something unique? Create custom item types with custom fields tailored to your specific workflow.',
}: ItemTypesSectionProps) {
  return (
    <section id="item-types" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {itemTypes.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              data-testid={`item-type-card-${item.id}`}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          ))}

          {/* Custom types card */}
          <div
            className="bg-indigo-50 dark:bg-indigo-950/40 rounded-lg p-6 shadow-sm border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex flex-col justify-between hover:border-indigo-500 transition-colors"
            data-testid="custom-item-type-card"
          >
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                {customCardTitle}
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {customCardDescription}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Customizable &rarr;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ItemTypesSection;